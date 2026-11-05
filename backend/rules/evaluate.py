
import json
from pathlib import Path

from backend.rules.rule_engine import analyze_draft

ROOT = Path(__file__).resolve().parents[2]

TEST_FILE = (
    ROOT / "seed_data" / "test_cases" / "benchmark_cases.json"
)


def evaluate():
    with open(TEST_FILE, "r", encoding="utf-8") as file:
        test_cases = json.load(file)

    tp = 0
    fp = 0
    fn = 0
    total_time = 0

    passed_cases = 0
    failed_cases = 0

    for case in test_cases:
        result = analyze_draft(case["text"])

        predicted = {
            issue["category"]
            for issue in result["issues"]
        }

        expected = set(case["expected"])

        case_tp = len(predicted & expected)
        case_fp = len(predicted - expected)
        case_fn = len(expected - predicted)

        tp += case_tp
        fp += case_fp
        fn += case_fn

        total_time += result["execution_time_ms"]

        print(f"\nTest Case: {case['id']}")
        print("Expected:", expected)
        print("Predicted:", predicted)

        if predicted == expected:
            passed_cases += 1
            print("Status: PASSED")
        else:
            failed_cases += 1
            print("Status: FAILED")
            print("Missing:", expected - predicted)
            print("Unexpected:", predicted - expected)
            print("Input:", case["text"])

    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0

    f1_score = (
        2 * precision * recall / (precision + recall)
        if (precision + recall) else 0
    )

    total_cases = len(test_cases)
    average_time = total_time / total_cases if total_cases else 0

    print("\n========== EVALUATION REPORT ==========")
    print("Total Cases:", total_cases)
    print("Passed Cases:", passed_cases)
    print("Failed Cases:", failed_cases)

    print("\n--- Detection Metrics ---")
    print("True Positives:", tp)
    print("False Positives:", fp)
    print("False Negatives:", fn)

    print(f"Precision: {precision * 100:.2f}%")
    print(f"Recall: {recall * 100:.2f}%")
    print(f"F1 Score: {f1_score * 100:.2f}%")

    print("\n--- Performance ---")
    print(f"Average Execution Time: {average_time:.3f} ms")


if __name__ == "__main__":
    evaluate()
