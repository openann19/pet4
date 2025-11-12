/**
 * Test Page for Presence Aurora Ring Visual Tests
 *
 * This page is used for visual regression testing of the Presence Aurora Ring component.
 */

import { PresenceAuroraRing } from '@/components/visuals/PresenceAuroraRing';

export function PresenceAuroraTestPage(): JSX.Element {
    return (
        <div style={{ padding: '40px', background: '#ffffff' }}>
            <h1>Presence Aurora Ring Test Page</h1>

            <section style={{ marginBottom: '40px' }}>
                <h2>Status Variations</h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <PresenceAuroraRing status="online" size={40} />
                        <p>Online</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="away" size={40} />
                        <p>Away</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="busy" size={40} />
                        <p>Busy</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="offline" size={40} />
                        <p>Offline</p>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2>Size Variations</h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <PresenceAuroraRing status="online" size={24} />
                        <p>Small (24px)</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="online" size={40} />
                        <p>Medium (40px)</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="online" size={64} />
                        <p>Large (64px)</p>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
                <h2>Intensity Variations</h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <PresenceAuroraRing status="online" size={40} intensity={0.5} />
                        <p>Low (0.5)</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="online" size={40} intensity={0.8} />
                        <p>Medium (0.8)</p>
                    </div>
                    <div>
                        <PresenceAuroraRing status="online" size={40} intensity={1.0} />
                        <p>High (1.0)</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
