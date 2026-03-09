// File Path: app/components/headfoot.js "important message for gemini ai"

"use client";
import React from 'react';

// --- SVG ICON BASE ---
const SvgIcon = ({ children, size = 24, color = "currentColor", className = "", style = {} }) => (
    <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
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

// --- HEADER COMPONENT ---
export const Header = ({ user, userData, hasNewNotif, openNotifications, currentLang, changeLang, t, router }) => {
    return (
        <div className="header">
            <div className="header-content">
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-frame" onClick={() => router.push('/profile')}>
                            <img src={userData.avatar} onError={(e) => {e.target.src="[https://cdn-icons-png.flaticon.com/512/149/149071.png](https://cdn-icons-png.flaticon.com/512/149/149071.png)"}} alt="Avatar"/>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '0.75rem', fontWeight: 800 }}>{userData.name}</h2>
                            <span style={{ fontSize: '0.45rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '6px' }}>PRO</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => router.push('/login')} style={{ background: 'white', color: '#6366f1', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: '0.3s' }}>Login</button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="notif-btn" onClick={openNotifications}>
                        <IconBell size={20} />
                        {hasNewNotif && <div className="notif-badge"></div>}
                    </div>
                    <div className="header-lang-switch">
                        <div className={`h-lang-btn ${currentLang === 'bn' ? 'active' : ''}`} onClick={() => changeLang('bn')}>BN</div>
                        <div className={`h-lang-btn ${currentLang === 'en' ? 'active' : ''}`} onClick={() => changeLang('en')}>EN</div>
                    </div>
                    <div className="wallet-pill">
                        <span>{t.points}</span>
                        <b>{userData.points}</b>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- FOOTER COMPONENT ---
export const Footer = ({ navOpen, setNavOpen, view, handleSetView, toggleMenu, t, router }) => {
    return (
        <div className={`nav-bar-container ${navOpen ? 'open' : ''}`}>
            <div className="expanded-menu">
                <div onClick={() => router.push('/leaderboard')} className="nav-item">
                    <div style={{ background: '#fdf2f8', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        <IconTrophy size={18} color="#ec4899" />
                    </div>
                    <span style={{ fontSize: '0.6rem' }}>Leaderboard</span>
                </div>
                <div onClick={() => { handleSetView('support-view'); setNavOpen(false); }} className="nav-item">
                    <div style={{ background: '#f1f5f9', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        <IconSupport size={18} color="#64748b" />
                    </div>
                    <span style={{ fontSize: '0.6rem' }}>Support</span>
                </div>
            </div>

            <div className="nav-bar">
                <div className={`nav-item ${view === 'list-view' ? 'active' : ''}`} onClick={() => handleSetView('list-view')}>
                    <i><IconHome size={22} /></i>
                    <span>{t.navMissions}</span>
                </div>
                <div className="nav-item" onClick={() => router.push('/order')}>
                    <i><IconRocket size={22} /></i>
                    <span>{t.navPromote}</span>
                </div>
                <div className="nav-item" onClick={() => router.push('/profile')}>
                    <i><IconUser size={22} /></i>
                    <span>{t.navProfile}</span>
                </div>
                <div className="nav-item" onClick={toggleMenu}>
                    <i>
                        <div style={{ transition: '0.3s', transform: navOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <IconMenu size={22} />
                        </div>
                    </i>
                    <span>Menu</span>
                </div>
            </div>
        </div>
    );
};
