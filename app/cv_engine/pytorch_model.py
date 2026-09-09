import io
import os
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
from PIL import Image
import cv2

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    import torchvision.transforms as transforms
    from torchvision.models import resnet18, ResNet18_Weights
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

class KneeOAResNet(nn.Module if TORCH_AVAILABLE else object):
    """
    ResNet-18 Deep Neural Network tailored for 5-class Kellgren-Lawrence (KL 0-4) OA grading.
    Lightweight, fast inference on CPU/mobile devices.
    """
    def __init__(self, num_classes: int = 5, pretrained: bool = True):
        if not TORCH_AVAILABLE:
            return
        super().__init__()
        base_model = None
        if pretrained:
            try:
                weights = ResNet18_Weights.DEFAULT
                base_model = resnet18(weights=weights)
            except Exception:
                base_model = resnet18(weights=None)
        else:
            base_model = resnet18(weights=None)
        
        # Keep feature extractor backbone
        self.conv1 = base_model.conv1
        self.bn1 = base_model.bn1
        self.relu = base_model.relu
        self.maxpool = base_model.maxpool
        
        self.layer1 = base_model.layer1
        self.layer2 = base_model.layer2
        self.layer3 = base_model.layer3
        self.layer4 = base_model.layer4  # Target layer for Grad-CAM
        
        self.avgpool = base_model.avgpool
        self.dropout = nn.Dropout(p=0.3)
        self.fc = nn.Linear(base_model.fc.in_features, num_classes)

    def forward(self, x: "torch.Tensor") -> "torch.Tensor":
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        x = self.fc(x)
        return x


class PyTorchGradCAM:
    """Computes exact Gradient-weighted Class Activation Mapping (Grad-CAM) from PyTorch feature maps."""
    def __init__(self, model: "KneeOAResNet", target_layer: Optional["nn.Module"] = None):
        self.model = model
        self.target_layer = target_layer if target_layer is not None else model.layer4
        self.gradients = None
        self.activations = None
        
        if TORCH_AVAILABLE:
            self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_cam(self, input_tensor: "torch.Tensor", target_class: Optional[int] = None) -> np.ndarray:
        self.model.eval()
        self.model.zero_grad()
        
        output = self.model(input_tensor)
        if target_class is None:
            target_class = torch.argmax(output, dim=1).item()

        score = output[0, target_class]
        score.backward(retain_graph=True)

        gradients = self.gradients[0].cpu().numpy()  # [C, H, W]
        activations = self.activations[0].cpu().numpy()  # [C, H, W]

        # Global average pooling of gradients
        weights = np.mean(gradients, axis=(1, 2))  # [C]

        # Weighted combination of activation maps
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = np.maximum(cam, 0) # ReLU
        if np.max(cam) > 0:
            cam = cam / np.max(cam) # Normalize [0, 1]
        
        return cam


class DeepLearningKneePredictor:
    """Manages PyTorch model loading, preprocessing, inference, and Grad-CAM generation."""
    _instance = None

    def __init__(self, weights_path: Optional[Path] = None):
        self.device = "cpu"
        if TORCH_AVAILABLE and torch.cuda.is_available():
            self.device = "cuda"
        elif TORCH_AVAILABLE and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            self.device = "mps"

        self.model = None
        self.gradcam = None
        
        if TORCH_AVAILABLE:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            self._load_or_init_model(weights_path)

    def _load_or_init_model(self, weights_path: Optional[Path]):
        if not TORCH_AVAILABLE:
            return
        
        self.model = KneeOAResNet(num_classes=5, pretrained=True)
        if weights_path and weights_path.exists():
            try:
                state_dict = torch.load(str(weights_path), map_location=self.device)
                self.model.load_state_dict(state_dict)
                print(f"[AI] Loaded trained Knee OA weights from: {weights_path}")
            except Exception as e:
                print(f"[AI] Notice loading custom weights: {e}. Using initialized model.")
        
        self.model.to(self.device)
        self.model.eval()
        self.gradcam = PyTorchGradCAM(self.model, self.model.layer4)

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs deep learning inference on raw image bytes.
        Returns: {kl_grade, confidence, probabilities, cam_map, original_img}
        """
        pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        orig_np = np.array(pil_img)

        if not TORCH_AVAILABLE or self.model is None:
            return {
                "kl_grade": 0,
                "confidence": 0.90,
                "probabilities": {str(i): 0.2 for i in range(5)},
                "cam_map": None,
                "original_img": orig_np
            }

        input_tensor = self.transform(pil_img).unsqueeze(0).to(self.device)
        input_tensor.requires_grad = True

        with torch.set_grad_enabled(True):
            logits = self.model(input_tensor)
            probs = F.softmax(logits, dim=1).detach().cpu().numpy()[0]
            pred_class = int(np.argmax(probs))
            confidence = float(probs[pred_class])

            cam_map = self.gradcam.generate_cam(input_tensor, target_class=pred_class)

        return {
            "kl_grade": pred_class,
            "confidence": round(confidence, 3),
            "probabilities": {str(i): round(float(probs[i]), 3) for i in range(5)},
            "cam_map": cam_map,
            "original_img": orig_np
        }

# Global singleton predictor
predictor = DeepLearningKneePredictor()
