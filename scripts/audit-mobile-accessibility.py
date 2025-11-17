#!/usr/bin/env python3
"""
Mobile Accessibility Props Audit Script

Scans all mobile components for React Native accessibility props compliance.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

@dataclass
class Violation:
    file: str
    line: int
    element: str
    issue: str
    severity: str
    recommendation: str
    code_snippet: str

def find_component_files(root_dir: str) -> List[str]:
    """Find all component TSX files."""
    files = []
    excluded_dirs = {'__tests__', 'node_modules', '.next', 'dist', 'build'}
    excluded_suffixes = {'.test.tsx', '.spec.tsx', '.stories.tsx'}

    for root, dirs, filenames in os.walk(root_dir):
        # Remove excluded directories
        dirs[:] = [d for d in dirs if d not in excluded_dirs]

        for filename in filenames:
            if filename.endswith('.tsx') and not any(filename.endswith(suffix) for suffix in excluded_suffixes):
                files.append(os.path.join(root, filename))

    return files

def audit_file(file_path: str, root_dir: str) -> List[Violation]:
    """Audit a single file for accessibility violations."""
    violations = []
    relative_path = os.path.relpath(file_path, root_dir)

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception:
        return violations

    # Pattern 1: TouchableOpacity, TouchableHighlight, Pressable without accessibilityRole
    touchable_pattern = r'<(TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Pressable)([^>]*?)>'
    for match in re.finditer(touchable_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        element_type = match.group(1)
        attributes = match.group(2) or ''

        # Check for accessibilityRole
        has_role = re.search(r'accessibilityRole\s*=', attributes, re.IGNORECASE)
        has_label = re.search(r'accessibilityLabel\s*=', attributes, re.IGNORECASE)

        if not has_role and not has_label:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element=element_type,
                issue='Touchable component missing accessibilityRole and accessibilityLabel',
                severity='error',
                recommendation='Add accessibilityRole and accessibilityLabel props',
                code_snippet=match.group(0)[:100]
            ))
        elif not has_label:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element=element_type,
                issue='Touchable component missing accessibilityLabel',
                severity='error',
                recommendation='Add accessibilityLabel prop with descriptive text',
                code_snippet=match.group(0)[:100]
            ))

    # Pattern 2: Image components without accessibilityLabel
    image_pattern = r'<Image([^>]*?)>'
    for match in re.finditer(image_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        attributes = match.group(1) or ''

        # Skip if it's decorative (has accessibilityIgnoresInvertColors or accessibilityRole="none")
        is_decorative = re.search(r'accessibilityRole\s*=\s*["\']none["\']', attributes, re.IGNORECASE) or \
                       re.search(r'accessibilityIgnoresInvertColors', attributes, re.IGNORECASE)

        has_label = re.search(r'accessibilityLabel\s*=', attributes, re.IGNORECASE)

        if not is_decorative and not has_label:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element='Image',
                issue='Image missing accessibilityLabel',
                severity='error',
                recommendation='Add accessibilityLabel prop or mark as decorative with accessibilityRole="none"',
                code_snippet=match.group(0)[:100]
            ))

    # Pattern 3: TextInput without accessibilityLabel
    textinput_pattern = r'<TextInput([^>]*?)>'
    for match in re.finditer(textinput_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        attributes = match.group(1) or ''

        has_label = re.search(r'accessibilityLabel\s*=', attributes, re.IGNORECASE)
        has_placeholder = re.search(r'placeholder\s*=', attributes, re.IGNORECASE)

        # Placeholder can serve as label, but accessibilityLabel is preferred
        if not has_label and not has_placeholder:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element='TextInput',
                issue='TextInput missing accessibilityLabel and placeholder',
                severity='error',
                recommendation='Add accessibilityLabel prop or placeholder',
                code_snippet=match.group(0)[:100]
            ))

    # Pattern 4: Button components without accessibilityLabel
    button_pattern = r'<Button([^>]*?)>'
    for match in re.finditer(button_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        attributes = match.group(1) or ''

        has_label = re.search(r'accessibilityLabel\s*=', attributes, re.IGNORECASE)
        has_title = re.search(r'title\s*=', attributes, re.IGNORECASE)

        if not has_label and not has_title:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element='Button',
                issue='Button missing accessibilityLabel and title',
                severity='error',
                recommendation='Add accessibilityLabel prop or title prop',
                code_snippet=match.group(0)[:100]
            ))

    # Pattern 5: View components with onPress but no accessibilityRole
    view_with_press_pattern = r'<View([^>]*onPress[^>]*?)>'
    for match in re.finditer(view_with_press_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        attributes = match.group(1) or ''

        has_role = re.search(r'accessibilityRole\s*=', attributes, re.IGNORECASE)
        has_label = re.search(r'accessibilityLabel\s*=', attributes, re.IGNORECASE)

        if not has_role:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element='View',
                issue='View with onPress missing accessibilityRole',
                severity='error',
                recommendation='Add accessibilityRole="button" and accessibilityLabel',
                code_snippet=match.group(0)[:100]
            ))
        elif not has_label:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element='View',
                issue='View with onPress missing accessibilityLabel',
                severity='error',
                recommendation='Add accessibilityLabel prop',
                code_snippet=match.group(0)[:100]
            ))

    return violations

def generate_report(results: Dict[str, Any]) -> str:
    """Generate markdown report."""
    total_components = results['total_components']
    violations = results['violations']
    warnings = results['warnings']

    error_count = len(violations)
    warning_count = len(warnings)

    compliance_rate = ((total_components - error_count) / total_components * 100) if total_components > 0 else 0

    report = f"""# Mobile Accessibility Props Audit Report

**Generated**: {results['timestamp']}

## Summary

- **Total Components Audited**: {total_components}
- **Total Violations**: {error_count} errors, {warning_count} warnings
- **Compliance Rate**: {compliance_rate:.1f}%

"""

    if error_count == 0 and warning_count == 0:
        report += "## ✅ All Clear\n\nAll components have proper accessibility props.\n\n"
        return report

    if error_count > 0:
        report += f"## Violations by Severity\n\n### Errors ({error_count})\n\n"
        report += "| File | Line | Element | Issue | Recommendation |\n"
        report += "|------|------|---------|-------|----------------|\n"

        for violation in violations:
            file_display = violation['file'].replace('apps/mobile/src/components/', '')
            report += f"| `{file_display}` | {violation['line']} | `{violation['element']}` | {violation['issue']} | {violation['recommendation']} |\n"
        report += "\n"

    if warning_count > 0:
        report += f"### Warnings ({warning_count})\n\n"
        report += "| File | Line | Element | Issue | Recommendation |\n"
        report += "|------|------|---------|-------|----------------|\n"

        for warning in warnings:
            file_display = warning['file'].replace('apps/mobile/src/components/', '')
            report += f"| `{file_display}` | {warning['line']} | `{warning['element']}` | {warning['issue']} | {warning['recommendation']} |\n"
        report += "\n"

    report += """## Recommendations

1. **Touchable Components**: All TouchableOpacity, TouchableHighlight, Pressable must have `accessibilityRole` and `accessibilityLabel`
2. **Images**: All Image components must have `accessibilityLabel` or be marked as decorative with `accessibilityRole="none"`
3. **TextInputs**: All TextInput components must have `accessibilityLabel` or `placeholder`
4. **Buttons**: All Button components must have `accessibilityLabel` or `title`
5. **Interactive Views**: Views with `onPress` must have `accessibilityRole="button"` and `accessibilityLabel`
6. **Touch Target Sizes**: All interactive elements must meet 44x44dp minimum size
7. **State Announcements**: Use `accessibilityState` for dynamic states (selected, disabled, etc.)
8. **Hints**: Use `accessibilityHint` for additional context when helpful

"""

    return report

def main():
    """Main function."""
    print("🔍 Starting Mobile Accessibility Props Audit...\n")

    root_dir = os.path.join(os.getcwd(), 'apps/mobile/src/components')
    files = find_component_files(root_dir)
    print(f"Found {len(files)} component files to audit\n")

    all_violations = []

    for file_path in files:
        violations = audit_file(file_path, os.path.join(os.getcwd(), 'apps/mobile/src/components'))
        all_violations.extend(violations)

    errors = [asdict(v) for v in all_violations if v.severity == 'error']
    warnings = [asdict(v) for v in all_violations if v.severity == 'warning']

    results = {
        'timestamp': str(Path(__file__).stat().st_mtime),
        'total_components': len(files),
        'violations': errors,
        'warnings': warnings,
    }

    print(f"✅ Audit complete!\n")
    print(f"- Total violations: {len(errors)} errors, {len(warnings)} warnings\n")

    # Generate report
    report = generate_report(results)
    report_dir = os.path.join(os.getcwd(), 'docs/accessibility')
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, 'mobile-accessibility-audit-report.md')

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"📄 Report saved to: {report_path}\n")

    if errors:
        print(f"❌ Found {len(errors)} errors that need to be fixed.\n")
    if warnings:
        print(f"⚠️  Found {len(warnings)} warnings to review.\n")
    if not errors and not warnings:
        print("✅ No violations found! All components are compliant.\n")

if __name__ == '__main__':
    main()
