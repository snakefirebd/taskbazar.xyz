// File Path: /components/headfoot.js

"use client";
import React from 'react';

// --- SVG ICON BASE ---
const SvgIcon = ({ children, size = 24, color = "currentColor", className = "", style = {} }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        {children}
    </svg>
);

// --- HEADER & FOOTER ICONS ---
const IconTrophy = (props) => <SvgIcon {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></SvgIcon>;
const IconSupport = (props) => <SvgIcon {...props}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><path d="M19 22v-3"/></SvgIcon>;
const IconHome = (props) => <SvgIcon {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgIcon>;
const IconRocket = (props) => <SvgIcon {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></SvgIcon>;
const IconUser = (props) => <SvgIcon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>;
const IconBell = (props) => <SvgIcon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></SvgIcon>;
const IconMenu = (props) => <SvgIcon {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></SvgIcon>;

// --- SHARED STYLES ---
const SharedStyles = () => (
    <style>{`
        /* Header Styles */
        .hf-header {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 12px 15px 25px;
            border-bottom-left-radius: 25px; border-bottom-right-radius: 25px;
            position: sticky; top: 0; z-index: 100; box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15);
        }
        .hf-header-content { display: flex; justify-content: space-between; align-items: center; max-width: 500px; margin: 0 auto; gap: 8px; }

        .hf-avatar-frame {
            width: 36px; height: 36px; border-radius: 12px;
            background: rgba(255,255,255,0.2); border: 1.5px solid rgba(255,255,255,0.4);
            backdrop-filter: blur(10px); overflow: hidden; display: flex; justify-content: center; align-items: center; flex-shrink: 0; cursor: pointer;
        }
        .hf-avatar-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .hf-lang-switch { display: flex; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); }
        .hf-lang-btn { padding: 4px 8px; font-size: 0.55rem; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s; color: rgba(255,255,255,0.6); }
        .hf-lang-btn.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

        .hf-wallet-pill { background: rgba(255,255,255,0.15); backdrop-filter: blur(15px); padding: 5px 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.25); text-align: right; }
        .hf-wallet-pill span { font-size: 0.45rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; display: block; line-height: 1; }
        .hf-wallet-pill b { display: block; font-size: 0.95rem; font-weight: 800; line-height: 1.2; }

        .hf-notif-btn { position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.15); cursor: pointer; transition: 0.3s; }
        .hf-notif-badge { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #f43f5e; border-radius: 50%; border: 2px solid #6366f1; }

        /* Footer Styles */
        .hf-nav-container { position: fixed; bottom: 15px; left: 15px; right: 15px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
        .hf-expanded-menu { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 20px; padding: 12px; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #fff; opacity: 0; transform: translateY(20px); pointer-events: none; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .hf-nav-container.open .hf-expanded-menu { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .hf-nav-bar { height: 65px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-radius: 20px; display: flex; align-items: center; justify-content: space-around; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #fff; pointer-events: auto; }
        .hf-nav-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; cursor: pointer; text-decoration: none; transition: 0.3s; }
        .hf-nav-item.active { color: #6366f1; transform: translateY(-2px); }
        .hf-nav-item i { font-size: 1.2rem; margin-bottom: 1px; font-style: normal; display: flex; justify-content: center; align-items: center; }
        .hf-nav-item span { font-size: 0.5rem; font-weight: 700; }
    `}</style>
);

// --- HEADER COMPONENT ---
export const Header = ({ user, userData, hasNewNotif, openNotifications, currentLang, changeLang, t, router }) => {
    // Fallback labels if translation is missing
    const pointsLabel = t?.points || "Points";
    const userName = userData?.name || "User";
    const userAvatar = userData?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    const userPoints = userData?.points || 0;

    return (
        <>
            <SharedStyles />
            <div className="hf-header">
                <div className="hf-header-content">
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="hf-avatar-frame" onClick={() => router.push('/profile')}>
                                <img src={userAvatar} onError={(e) => {e.target.src="https://cdn-icons-png.flaticon.com/512/149/149071.png"}} alt="Avatar"/>
                            </div>
                            <div>
                                <h2 style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0 }}>{userName.split(' ')[0]}</h2>
                                <span style={{ fontSize: '0.45rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '6px' }}>PRO</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button onClick={() => router.push('/login')} style={{ background: 'white', color: '#6366f1', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: '0.3s' }}>Login</button>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="hf-notif-btn" onClick={openNotifications}>
                            <IconBell size={20} />
                            {hasNewNotif && <div className="hf-notif-badge"></div>}
                        </div>
                        <div className="hf-lang-switch">
                            <div className={`hf-lang-btn ${currentLang === 'bn' ? 'active' : ''}`} onClick={() => changeLang('bn')}>BN</div>
                            <div className={`hf-lang-btn ${currentLang === 'en' ? 'active' : ''}`} onClick={() => changeLang('en')}>EN</div>
                        </div>
                        <div className="hf-wallet-pill">
                            <span>{pointsLabel}</span>
                            <b>{userPoints.toLocaleString()}</b>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- FOOTER COMPONENT ---
export const Footer = ({ navOpen, setNavOpen, view, handleSetView, toggleMenu, t, router }) => {
    // Fallback labels if translation is missing
    const navMissions = t?.navMissions || "Missions";
    const navPromote = t?.navPromote || "Promote";
    const navProfile = t?.navProfile || "Profile";
    const navLeaderboard = t?.navLeaderboard || "Leaderboard";
    const navSupport = t?.navSupport || "Support";
    const navMenu = t?.navMenu || "Menu";

    return (
        <>
            <SharedStyles />
            <div className={`hf-nav-container ${navOpen ? 'open' : ''}`}>
                <div className="hf-expanded-menu">
                    <div onClick={() => { router.push('/leaderboard'); setNavOpen(false); }} className="hf-nav-item">
                        <div style={{ background: '#fdf2f8', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                            <IconTrophy size={18} color="#ec4899" />
                        </div>
                        <span style={{ fontSize: '0.6rem' }}>{navLeaderboard}</span>
                    </div>
                    {/* Support Button Update: সরাসরি /complaint পেজে রিডাইরেক্ট করবে */}
                    <div onClick={() => { router.push('/complaint'); setNavOpen(false); }} className="hf-nav-item">
                        <div style={{ background: '#f1f5f9', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                            <IconSupport size={18} color="#64748b" />
                        </div>
                        <span style={{ fontSize: '0.6rem' }}>{navSupport}</span>
                    </div>
                </div>

                <div className="hf-nav-bar">
                    <div className={`hf-nav-item ${view === 'list-view' ? 'active' : ''}`} onClick={() => { handleSetView && handleSetView('list-view'); router.push('/'); }}>
                        <i><IconHome size={22} /></i>
                        <span>{navMissions}</span>
                    </div>
                    <div className="hf-nav-item" onClick={() => router.push('/order')}>
                        <i><IconRocket size={22} /></i>
                        <span>{navPromote}</span>
                    </div>
                    <div className="hf-nav-item" onClick={() => router.push('/profile')}>
                        <i><IconUser size={22} /></i>
                        <span>{navProfile}</span>
                    </div>
                    <div className="hf-nav-item" onClick={toggleMenu}>
                        <i>
                            <div style={{ transition: '0.3s', transform: navOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                <IconMenu size={22} />
                            </div>
                        </i>
                        <span>{navMenu}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

