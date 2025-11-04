#!/usr/bin/env python3
"""
Particle System Desktop Launcher
Opens e.html in a desktop window (no browser needed)
"""

import os
import sys
import webview

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(script_dir, 'e.html')
    
    # Convert to file:// URL
    html_url = f'file://{html_file}'
    
    print(f'Starting particle system...')
    print(f'File: {html_file}')
    print(f'Press Ctrl+C to exit')
    
    # Create window
    webview.create_window(
        'Electric Souls - Particle System',
        html_url,
        width=1920,
        height=1080,
        resizable=True,
        fullscreen=False,
        min_size=(800, 600)
    )
    
    # Start the webview
    webview.start(debug=False)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nExiting...')
        sys.exit(0)
    except Exception as e:
        print(f'Error: {e}')
        print('\nInstalling webview...')
        print('Run: pip install pywebview')
        sys.exit(1)
