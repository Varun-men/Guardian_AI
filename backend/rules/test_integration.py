from backend.rules.integration import run_rule_checks


content = """
Meet Orbit.

Our product offers guaranteed success.
Orbit Starter costs $39 per month.
"""

images = [
    {
        "filename": "orbit-hero.png",
        "alt": ""
    }
]

result = run_rule_checks(content, images)

print("\nDetected Issues:")

for issue in result["issues"]:
    print("----------------------------")
    print("Category:", issue["category"])
    print("Severity:", issue["severity"])
    print("Flagged:", issue["flagged_text"])
    print("Explanation:", issue["explanation"])

print("\nTotal Issues:", result["total_issues"])
print("Execution Time:", result["execution_time_ms"], "ms")