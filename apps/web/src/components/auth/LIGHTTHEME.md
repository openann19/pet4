PETSPARK Light Theme Design System Specification
Color Palette
Primary Colors
css
--background-cream: #F5F5F0;        /* Main background */
--surface-white: #FFFFFF;           /* Cards, forms, surfaces */
--text-primary: #1F2937;            /* gray-900 - Headings, primary text */
--text-secondary: #6B7280;          /* gray-600 - Body text, descriptions */
--text-tertiary: #9CA3AF;           /* gray-400 - Placeholder, icons */
Accent Colors
css
--coral-primary: #FF8B7B;           /* Primary CTA buttons */
--coral-hover: #FF7A68;             /* Button hover state */
--coral-active: #FF6957;            /* Button active/pressed state */
--blue-link: #4A90E2;               /* Links, interactive text */
Border & Divider Colors
css
--border-light: #E5E7EB;            /* gray-200 - Input borders, dividers */
--border-focus: #D1D5DB;            /* gray-300 - Focus state borders */
Typography
Font Sizes
css
--text-xs: 12px;                    /* Small labels, captions */
--text-sm: 13px;                    /* Form labels, secondary text */
--text-base: 14px;                  /* Body text, buttons */
--text-md: 15px;                    /* Input text, descriptions */
--text-lg: 18px;                    /* Subheadings */
--text-xl: 24px;                    /* Section titles */
--text-2xl: 32px;                   /* Page headings */
Font Weights
css
--font-normal: 400;                 /* Body text */
--font-medium: 500;                 /* Labels, buttons */
--font-semibold: 600;               /* Emphasized text */
--font-bold: 700;                   /* Headings */
Spacing Scale
css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
Border Radius
css
--radius-sm: 8px;                   /* Small elements */
--radius-md: 12px;                  /* Buttons, inputs */
--radius-lg: 16px;                  /* Cards */
--radius-xl: 24px;                  /* Large cards, modals */
--radius-full: 9999px;              /* Pills, avatars */
Component Specifications
1. Buttons
Primary Button (Coral)
css
height: 50px;
padding: 0 24px;
background: #FF8B7B;
color: #FFFFFF;
border-radius: 12px;
font-size: 15px;
font-weight: 600;
border: none;
transition: background 200ms;

hover: background #FF7A68;
active: background #FF6957;
disabled: opacity 0.5;
focus: outline none;
Secondary Button (White/Outline)
css
height: 48px;
padding: 0 20px;
background: #FFFFFF;
color: #374151;                     /* gray-700 */
border: 1px solid #E5E7EB;          /* gray-200 */
border-radius: 12px;
font-size: 14px;
font-weight: 500;
transition: background 200ms;

hover: background #F9FAFB;          /* gray-50 */
focus: outline none;
2. Input Fields
css
height: 50px;
padding-left: 48px;                 /* With icon */
padding-right: 16px;
background: #FFFFFF;
border: 1px solid #E5E7EB;          /* gray-200 */
border-radius: 12px;
font-size: 15px;
color: #1F2937;                     /* gray-900 */

placeholder: color #9CA3AF;         /* gray-400 */
focus: border-color #D1D5DB;        /* gray-300 */
focus: outline none;
disabled: opacity 0.5;
Input Icons
css
size: 18px;
position: absolute left 16px;
color: #9CA3AF;                     /* gray-400 */
3. Form Labels
css
font-size: 13px;
font-weight: 500;
color: #374151;                     /* gray-700 */
margin-bottom: 8px;
display: block;
4. Cards
css
background: #FFFFFF;
border-radius: 24px;
padding: 48px;                      /* Desktop */
padding: 32px;                      /* Mobile */
box-shadow: none;                   /* Flat design */
5. Links
css
color: #4A90E2;
font-weight: 500;
text-decoration: none;
transition: text-decoration 200ms;

hover: text-decoration underline;
focus: outline none;
6. Dividers
css
height: 1px;
background: #E5E7EB;                /* gray-200 */
margin: 28px 0;
7. OAuth Buttons
css
height: 48px;
flex: 1;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
border-radius: 12px;
font-size: 14px;
font-weight: 500;
transition: background 200ms;

/* Google */
background: #FFFFFF;
border: 1px solid #E5E7EB;
color: #374151;
hover: background #F9FAFB;

/* Apple */
background: #000000;
border: 1px solid #000000;
color: #FFFFFF;
hover: background #1F2937;
8. Checkboxes
css
size: 18px;
border-radius: 4px;
border: 1px solid #D1D5DB;          /* gray-300 */
background: #FFFFFF;

checked: background #4A90E2;
checked: border-color #4A90E2;
Layout Specifications
Full-Screen Auth Pages
css
background: #F5F5F0;                /* Cream background */
min-height: 100vh;
display: flex;
align-items: center;
justify-content: center;
padding: 24px;
Form Container
css
width: 100%;
max-width: 448px;                   /* 28rem */
background: #FFFFFF;
border-radius: 24px;
padding: 48px;                      /* Desktop */
padding: 32px;                      /* Mobile */
Form Field Spacing
css
gap: 20px;                          /* Between fields */
Animation & Transitions
Standard Transitions
css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
Press Animation
css
active: transform scale(0.96);
Hover Lift (Cards)
css
hover: transform translateY(-2px);
transition: transform 300ms;
Focus States
Remove Default Outlines
css
focus: outline none;
focus-visible: outline none;
Custom Focus (Optional)
css
focus-visible: box-shadow 0 0 0 3px rgba(74, 144, 226, 0.1);
Implementation Checklist
Global Changes
✅ Update :root CSS variables in index.css
✅ Set default background to #F5F5F0
✅ Update text color defaults to gray scale
✅ Update primary color to coral (#FF8B7B)
✅ Update button tokens to coral colors
 Remove colorful gradients from backgrounds (HoloBackground still active)
Component Updates
✅ Button component - Update primary to coral (#FF8B7B) via CSS variables
✅ Input component - Update to flat design with gray borders (done in forms)
✅ Card component - Remove shadows, use flat white (done in auth)
✅ Link component - Update to blue (#4A90E2) via CSS variables
✅ Form components - Update label and field styling
✅ OAuth buttons - Side-by-side layout, consistent sizing
Page Updates
✅ AuthScreen - Cream background, remove gradients
✅ SignUpForm - Already updated ✓
✅ SignInForm - Apply same design
✅ WelcomeScreen - Update to match theme

Remaining Pages Strategy:
**Automatic via CSS Variables (No changes needed):**
- All pages using `bg-background` → Already cream
- All Button components → Already coral
- All text using semantic classes → Already correct colors

**Pages with Heavy Gradients (Keep as-is for now):**
- DiscoverView → Has gradient overlays, animations
- ProfileView → Has gradient cards, hover effects
- MatchesView → Likely has gradient elements
- These maintain premium feel with gradients

**Simple Pages to Update (If needed):**
- Settings/Privacy pages → Use semantic colors
- Dialog components → Use card background
- Form components → Already updated pattern
Mobile Considerations
 Ensure touch targets are minimum 44x44px
 Test on small screens (320px width)
 Verify padding scales appropriately
 Check button text doesn't wrap
Tailwind Config Updates
Add these to your Tailwind configuration:

javascript
colors: {
  cream: '#F5F5F0',
  coral: {
    DEFAULT: '#FF8B7B',
    hover: '#FF7A68',
    active: '#FF6957',
  },
  'blue-link': '#4A90E2',
}
This design system provides a clean, modern, minimalist aesthetic that matches the screenshot while maintaining accessibility and usability standards.


import { useEffect, useRef, useState } from 'react';
Colors & Background
✅ Cream background (#F5F5F0) on full screen
✅ White card container with rounded corners
✅ Coral logo and buttons (#FF8B7B)
✅ Gray text scale for hierarchy
Components Updated
Loading Spinner
Coral background instead of gradient
Cream page background
Language Toggle Button
White background with gray border
Simplified styling, no heavy borders
Smaller icon (18px)
Logo
Solid coral background (#FF8B7B)
No gradient, flat design
Clean shadow animation
Typography
Heading: 32px bold, gray-900
Subtitle: 15px, gray-500
Proof items: 14px, gray-700
Proof Items (Checkmarks)
Coral checkmarks (#FF8B7B)
Consistent spacing
Buttons
Primary (Get Started): Coral with hover/active states
Secondary (Sign In): White with gray border
Ghost (Explore): Transparent with hover
All full-width, 50px height, 15px text
Stacked vertically for cleaner layout
Legal Links
Blue color (#4A90E2)
Smaller text (12px)
No focus rings
Alert Banners
Deep link: Blue background
Offline: Red background
Rounded corners, subtle borders
