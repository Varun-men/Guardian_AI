
from backend.rules.rule_engine import analyze_draft
from backend.rules.accessibility import check_accessibility


def test_banned_word():
    result = analyze_draft(
        "Our product offers guaranteed success."
    )

    assert any(
        issue["category"] == "BANNED_TERM"
        for issue in result["issues"]
    )

    print("PASS: Banned word detection")


def test_competitor():
    result = analyze_draft(
        "Our product is better than NovaTech."
    )

    assert any(
        issue["category"] == "COMPETITOR_MENTION"
        for issue in result["issues"]
    )

    print("PASS: Competitor detection")


def test_wrong_price():
    result = analyze_draft(
        "Orbit Starter costs $39 per month."
    )

    assert any(
        issue["category"] == "INCORRECT_PRICING"
        for issue in result["issues"]
    )

    print("PASS: Incorrect pricing detection")

def test_pricing_suggested_fix_replaces_entire_sentence():
    result = analyze_draft(
        "Orbit Starter costs $39 per month."
    )

    issue = next(
        issue for issue in result["issues"]
        if issue["category"] == "INCORRECT_PRICING"
    )

    assert issue["flagged_text"] == (
        "Orbit Starter costs $39 per month."
    )

    assert issue["suggested_fix"] == (
        "Orbit Starter costs $29 per month."
    )

def test_correct_price():
    result = analyze_draft(
        "Orbit Starter costs $29 per month."
    )

    assert not any(
        issue["category"] == "INCORRECT_PRICING"
        for issue in result["issues"]
    )

    print("PASS: Correct pricing accepted")


def test_missing_alt():
    images = [
        {"filename": "hero.png", "alt": ""}
    ]

    issues = check_accessibility(images)

    assert len(issues) == 1
    assert issues[0]["category"] == "MISSING_ALT_TEXT"

    print("PASS: Missing alt text detection")


if __name__ == "__main__":
    test_banned_word()
    test_competitor()
    test_wrong_price()
    test_correct_price()
    test_missing_alt()

    print("\nAll initial tests passed!")
