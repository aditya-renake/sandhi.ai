import pytest
from app.cv_engine.functional_tests import FunctionalMobilityTester
from app.schemas.functional_tests import FunctionalTestRequest

def test_chair_stand_evaluation():
    req = FunctionalTestRequest(test_type="chair_stand_30s")
    res = FunctionalMobilityTester.evaluate_test(req)
    assert res.test_type == "chair_stand_30s"
    assert res.chair_stand_result is not None
    assert res.chair_stand_result.completed_repetitions >= 1
    assert len(res.exercise_prescriptions) > 0

def test_tug_evaluation():
    req = FunctionalTestRequest(test_type="timed_up_and_go")
    res = FunctionalMobilityTester.evaluate_test(req)
    assert res.test_type == "timed_up_and_go"
    assert res.tug_result is not None
    assert res.tug_result.total_duration_seconds > 0
