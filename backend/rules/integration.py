
from backend.rules.rule_engine import analyze_draft
from backend.rules.accessibility import check_accessibility


def run_rule_checks(content, images=None):

    # Run deterministic text checks
    result = analyze_draft(content)

    # Run accessibility checks
    accessibility_issues = check_accessibility(
        images or []
    )

    # Combine both results
    all_issues = (
        result["issues"] + accessibility_issues
    )

    return {
        "issues": all_issues,
        "total_issues": len(all_issues),
        "execution_time_ms": result["execution_time_ms"]
    }
