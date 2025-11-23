/**
 * Data Export Component
 *
 * Enhanced data export with support for multiple formats (JSON, CSV, XML) and data portability.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gdprApi } from '@/api/gdpr-api';
import { getGDPRService } from '@/lib/privacy/gdpr';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DataExport');

type ExportFormat = 'json' | 'csv' | 'xml';

interface DataExportProps {
  userId: string;
  onExportComplete?: () => void;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: Record<string, unknown>): string {
  const rows: string[] = [];

  // Flatten nested objects
  function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        Object.assign(result, flatten(value as Record<string, unknown>, newKey));
      } else {
        // At this point, value should be a primitive (string, number, boolean, etc.)
        result[newKey] = String(value as string | number | boolean);
      }
    }
    return result;
  }

  const flat = flatten(data);
  const headers = Object.keys(flat);
  rows.push(headers.join(','));
  rows.push(headers.map((h) => `"${String(flat[h] ?? '').replace(/"/g, '""')}"`).join(','));

  return rows.join('\n');
}

/**
 * Convert data to XML format
 */
function convertToXML(data: Record<string, unknown>, rootName = 'data'): string {
  function objectToXML(obj: Record<string, unknown>, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let xml = '';

    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      if (value === null || value === undefined) {
        xml += `${spaces}<${safeKey}></${safeKey}>\n`;
      } else if (Array.isArray(value)) {
        xml += `${spaces}<${safeKey}>\n`;
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            xml += `${spaces}  <item>\n${objectToXML(item as Record<string, unknown>, indent + 2)}${spaces}  </item>\n`;
          } else {
            xml += `${spaces}  <item>${String(item)}</item>\n`;
          }
        });
        xml += `${spaces}</${safeKey}>\n`;
      } else if (typeof value === 'object') {
        xml += `${spaces}<${safeKey}>\n${objectToXML(value as Record<string, unknown>, indent + 1)}${spaces}</${safeKey}>\n`;
      } else {
        // At this point, value should be a primitive (string, number, boolean, etc.)
        const stringValue = String(value as string | number | boolean);
        xml += `${spaces}<${safeKey}>${stringValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${safeKey}>\n`;
      }
    }

    return xml;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${objectToXML(data, 1)}</${rootName}>`;
}

export function DataExport({ userId, onExportComplete }: DataExportProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Handle data export
  const handleExport = async (): Promise<void> => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(false);

      const exportData = await gdprApi.exportUserData({
        userId,
      });

      // Convert and create download based on format
      let blob: Blob;
      let fileExtension: string; switch (exportFormat) {
        case 'json': {
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          fileExtension = 'json';
          break;
        }
        case 'csv': {
          const csvData = convertToCSV(exportData as unknown as Record<string, unknown>);
          blob = new Blob([csvData], { type: 'text/csv' });
          fileExtension = 'csv';
          break;
        }
        case 'xml': {
          const xmlData = convertToXML(exportData as unknown as Record<string, unknown>, 'userData');
          blob = new Blob([xmlData], { type: 'application/xml' });
          fileExtension = 'xml';
          break;
        }
        default: {
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          fileExtension = 'json';
          break;
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `petspark-data-export-${userId}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Request data portability if not JSON (GDPR Right to Data Portability)
      if (exportFormat !== 'json') {
        try {
          const gdprService = getGDPRService();
          await gdprService.requestDataPortability(userId, exportFormat);
          logger.debug('Data portability request submitted', { userId, format: exportFormat });
        } catch (error) {
          logger.error('Failed to submit data portability request', {
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }

      setExportSuccess(true);
      onExportComplete?.();

      // Reset success message after 5 seconds
      setTimeout(() => {
        setExportSuccess(false);
      }, 5000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to export user data', err, { userId });
      setExportError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>
          Download a copy of all your data stored in our system (GDPR Right to Access & Data Portability).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            You can request a copy of all your personal data. The export will include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>User profile information</li>
            <li>Pet profiles</li>
            <li>Matches and swipe history</li>
            <li>Chat messages</li>
            <li>Community posts and comments</li>
            <li>Payment history</li>
            <li>Verification data</li>
            <li>Consent records</li>
            <li>Preferences and settings</li>
          </ul>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Export Format</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="w-full p-2 border rounded"
            disabled={isExporting}
          >
            <option value="json">JSON (Recommended)</option>
            <option value="csv">CSV (Spreadsheet)</option>
            <option value="xml">XML (Structured Data)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {exportFormat === 'json' && 'Machine-readable format, best for developers'}
            {exportFormat === 'csv' && 'Spreadsheet format, best for data analysis'}
            {exportFormat === 'xml' && 'Structured format, best for data integration'}
          </p>
        </div>

        {exportError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Error: {exportError}</p>
          </div>
        )}

        {exportSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-600">Data exported successfully! Your download should start shortly.</p>
          </div>
        )}

        <Button onClick={() => void handleExport()} disabled={isExporting} className="w-full">
          {isExporting ? 'Exporting...' : 'Export My Data'}
        </Button>

        <p className="text-xs text-muted-foreground">
          The export will be downloaded as a {exportFormat.toUpperCase()} file. You can open it with appropriate software or a text editor.
        </p>
      </CardContent>
    </Card>
  );
}
