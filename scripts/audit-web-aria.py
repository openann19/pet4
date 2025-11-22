#!/usr/bin/env python3
"""
Web ARIA Labels Audit Script

Scans all web components for ARIA label compliance using regex patterns.
"""

import os
import re
import json
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
    """Audit a single file for ARIA violations."""
    violations = []
    relative_path = os.path.relpath(file_path, root_dir)

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception:
        return violations

    # Pattern 1: Icon buttons without aria-label
    icon_button_pattern = r'<(Button|IconButton|button)[^>]*(?:size\s*=\s*["\']icon["\']|className[^>]*icon)[^>]*>'
    for match in re.finditer(icon_button_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        element_content = match.group(0)

        # Check if aria-label exists in the same element or nearby
        if not re.search(r'aria-label\s*=', element_content, re.IGNORECASE):
            # Check next few lines
            start_line = max(0, line_num - 1)
            end_line = min(len(lines), line_num + 5)
            nearby_content = '\n'.join(lines[start_line:end_line])

            if not re.search(r'aria-label\s*=', nearby_content, re.IGNORECASE):
                violations.append(Violation(
                    file=relative_path,
                    line=line_num,
                    element='IconButton/Button',
                    issue='Icon button missing aria-label',
                    severity='error',
                    recommendation='Add aria-label prop with descriptive text (e.g., "Close dialog", "Send message")',
                    code_snippet=element_content[:100]
                ))

    # Pattern 2: Input elements without labels
    input_pattern = r'<(input|textarea|select)([^>]*?)>'
    for match in re.finditer(input_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        element_type = match.group(1)
        attributes = match.group(2) or ''

        # Skip hidden inputs
        if re.search(r'type\s*=\s*["\']hidden["\']', attributes, re.IGNORECASE):
            continue

        # Check for aria-label, aria-labelledby, or id
        has_aria_label = re.search(r'aria-label\s*=', attributes, re.IGNORECASE)
        has_aria_labelled_by = re.search(r'aria-labelledby\s*=', attributes, re.IGNORECASE)
        has_id = re.search(r'id\s*=\s*["\']([^"\']+)["\']', attributes, re.IGNORECASE)

        # Check if there's a label element with htmlFor
        has_label = False
        if has_id:
            id_match = re.search(r'id\s*=\s*["\']([^"\']+)["\']', attributes, re.IGNORECASE)
            if id_match:
                input_id = id_match.group(1)
                label_pattern = rf'htmlFor\s*=\s*["\']{re.escape(input_id)}["\']'
                has_label = re.search(label_pattern, content, re.IGNORECASE) is not None

        if not has_aria_label and not has_aria_labelled_by and not has_label:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element=element_type,
                issue='Form input missing label or aria-label',
                severity='error',
                recommendation='Add htmlFor/id relationship, aria-label, or aria-labelledby',
                code_snippet=match.group(0)[:100]
            ))

    # Pattern 3: Modal/Dialog elements without proper ARIA
    modal_pattern = r'<(Dialog|DialogContent|Modal|dialog)([^>]*?)>'
    for match in re.finditer(modal_pattern, content, re.IGNORECASE):
        line_num = content[:match.start()].count('\n') + 1
        element_type = match.group(1)
        attributes = match.group(2) or ''

        issues = []
        if not re.search(r'role\s*=\s*["\']dialog["\']', attributes, re.IGNORECASE) and \
           not re.search(r'role\s*=\s*["\']alertdialog["\']', attributes, re.IGNORECASE):
            # Check if it's using Radix UI Dialog (which handles ARIA automatically)
            if 'DialogPrimitive' not in content[:match.start()]:
                issues.append('Missing role="dialog"')

        if not re.search(r'aria-modal\s*=\s*["\']true["\']', attributes, re.IGNORECASE):
            if 'DialogPrimitive' not in content[:match.start()]:
                issues.append('Missing aria-modal="true"')

        if not re.search(r'aria-labelledby\s*=', attributes, re.IGNORECASE):
            if 'DialogPrimitive' not in content[:match.start()]:
                issues.append('Missing aria-labelledby')

        if issues:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element=element_type,
                issue=f'Modal/dialog missing ARIA attributes: {", ".join(issues)}',
                severity='error',
                recommendation='Add role="dialog", aria-modal="true", aria-labelledby, and optionally aria-describedby',
                code_snippet=match.group(0)[:150]
            ))

    # Pattern 4: Links without accessible text
    link_pattern = r'<(a|Link)([^>]*?)>(.*?)(?:</a>|</Link>)'
    for match in re.finditer(link_pattern, content, re.IGNORECASE | re.DOTALL):
        line_num = content[:match.start()].count('\n') + 1
        attributes = match.group(2) or ''
        children = match.group(3) or ''

        # Skip if it has aria-label
        if re.search(r'aria-label\s*=', attributes, re.IGNORECASE):
            continue

        # Check if link has visible text or image with alt text
        text_content = re.sub(r'<[^>]+>', '', children).strip()
        has_text = len(text_content) >= 2 and re.search(r'[A-Za-z0-9]{2,}', text_content)
        has_image_with_alt = re.search(r'<img[^>]*alt\s*=\s*["\'][^"\']+["\']', children, re.IGNORECASE)

        if not has_text and not has_image_with_alt:
            violations.append(Violation(
                file=relative_path,
                line=line_num,
                element='Link',
                issue='Link missing aria-label or accessible text',
                severity='warning',
                recommendation='Add aria-label prop or ensure link has visible text or image with alt text',
                code_snippet=match.group(0)[:150]
            ))

    return violations

def generate_report(results: Dict[str, Any]) -> str:
    """Generate markdown report."""
    total_components = results['total_components']
    violations = results['violations']
    warnings = results['warnings']
    by_component = results['by_component']

    error_count = len(violations)
    warning_count = len(warnings)

    compliance_rate = ((total_components - error_count) / total_components * 100) if total_components > 0 else 0

    report = f"""# Web ARIA Labels Audit Report

**Generated**: {results['timestamp']}

## Summary

- **Total Components Audited**: {total_components}
- **Total Violations**: {error_count} errors, {warning_count} warnings
- **Compliance Rate**: {compliance_rate:.1f}%

"""

    if error_count == 0 and warning_count == 0:
        report += "## ✅ All Clear\n\nAll components have proper ARIA labels and accessibility attributes.\n\n"
        return report

    if error_count > 0:
        report += f"## Violations by Severity\n\n### Errors ({error_count})\n\n"
        report += "| File | Line | Element | Issue | Recommendation |\n"
        report += "|------|------|---------|-------|----------------|\n"

        for violation in violations:
            file_display = violation['file'].replace('apps/web/src/components/', '')
            report += f"| `{file_display}` | {violation['line']} | `{violation['element']}` | {violation['issue']} | {violation['recommendation']} |\n"
        report += "\n"

    if warning_count > 0:
        report += f"### Warnings ({warning_count})\n\n"
        report += "| File | Line | Element | Issue | Recommendation |\n"
        report += "|------|------|---------|-------|----------------|\n"

        for warning in warnings:
            file_display = warning['file'].replace('apps/web/src/components/', '')
            report += f"| `{file_display}` | {warning['line']} | `{warning['element']}` | {warning['issue']} | {warning['recommendation']} |\n"
        report += "\n"

    report += """## Recommendations

1. **Icon Buttons**: All icon-only buttons must have `aria-label` prop
2. **Form Inputs**: All inputs must have associated labels via `htmlFor`/`id` or `aria-label`
3. **Modals/Dialogs**: Must have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`
4. **Interactive Elements**: Buttons, links, and custom interactive elements need `aria-label` or visible text
5. **Live Regions**: Dynamic content should use `aria-live` regions for screen reader announcements

"""

    return report

def main():
    """Main function."""
    print("🔍 Starting Web ARIA Labels Audit...\n")

    root_dir = os.path.join(os.getcwd(), 'apps/web/src/components')
    files = find_component_files(root_dir)
    print(f"Found {len(files)} component files to audit\n")

    all_violations = []
    by_component = {}

    for file_path in files:
        violations = audit_file(file_path, os.path.join(os.getcwd(), 'apps/web/src/components'))

        if violations:
            component_name = os.path.basename(file_path).replace('.tsx', '')
            by_component[component_name] = {
                'violations': [asdict(v) for v in violations if v.severity == 'error'],
                'warnings': [asdict(v) for v in violations if v.severity == 'warning'],
            }
            all_violations.extend(violations)

    errors = [asdict(v) for v in all_violations if v.severity == 'error']
    warnings = [asdict(v) for v in all_violations if v.severity == 'warning']

    results = {
        'timestamp': str(Path(__file__).stat().st_mtime),
        'total_components': len(files),
        'violations': errors,
        'warnings': warnings,
        'by_component': by_component,
    }

    print(f"✅ Audit complete!\n")
    print(f"- Total violations: {len(errors)} errors, {len(warnings)} warnings\n")

    # Generate report
    report = generate_report(results)
    report_dir = os.path.join(os.getcwd(), 'docs/accessibility')
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, 'web-aria-audit-report.md')

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
