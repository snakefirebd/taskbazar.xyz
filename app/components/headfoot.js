const Header = ({ user, userData, hasNewNotif, openNotifications, currentLang, changeLang, t, router }) => {
    return (
        <div className="header">
            <div className="header-content">
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar-frame" onClick={() => router.push('/profile')}>
                            <img src={userData.avatar} onError={(e) => {e.target.src="https://cdn-icons-png.flaticon.com/512/149/149071.png"}} alt="Avatar"/>
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

const Footer = ({ navOpen, setNavOpen, view, handleSetView, toggleMenu, t, router }) => {
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