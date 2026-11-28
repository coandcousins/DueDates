                function openUtilityModal(modalId) {
                    const modal = document.getElementById(modalId);
                    if (!modal) return;
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                }

                function closeUtilityModal(modalId) {
                    const modal = document.getElementById(modalId);
                    if (!modal) return;
                    if (modalId === 'import-modal' && typeof clearPendingImportFile === 'function') clearPendingImportFile();
                    modal.classList.remove('flex');
                    modal.classList.add('hidden');
                }

                function setSidebarOpen(isOpen) {
                    const sidebar = document.getElementById('app-sidebar');
                    const backdrop = document.getElementById('sidebar-backdrop');
                    const appShell = document.getElementById('app-shell');
                    const toggle = document.getElementById('sidebar-toggle');
                    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

                    const shouldBeOpen = isDesktop || isOpen;
                    sidebar.classList.toggle('is-open', shouldBeOpen);
                    appShell.classList.toggle('sidebar-collapsed', false);
                    backdrop.classList.toggle('hidden', isDesktop || !shouldBeOpen);
                    toggle.setAttribute('aria-expanded', String(shouldBeOpen));
                    toggle.setAttribute('aria-label', shouldBeOpen ? 'Close sidebar' : 'Open sidebar');
                }

                function toggleSidebar() {
                    if (sidebarDesktopQuery.matches) return;
                    const isOpen = document.getElementById('sidebar-toggle').getAttribute('aria-expanded') === 'true';
                    setSidebarOpen(!isOpen);
                }

                function setActiveTab(tabId) {
                    const activePanel = document.querySelector(`[data-tab-panel="${tabId}"]`);
                    if (!activePanel) return;

                    document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
                        panel.hidden = panel !== activePanel;
                    });

                    document.querySelectorAll('[data-tab-target]').forEach((tab) => {
                        const isActive = tab.dataset.tabTarget === tabId;
                        tab.classList.toggle('is-active', isActive);
                        if (tab.getAttribute('role') === 'tab') {
                            tab.setAttribute('aria-selected', String(isActive));
                        } else if (isActive) {
                            tab.setAttribute('aria-current', 'page');
                        } else {
                            tab.removeAttribute('aria-current');
                        }
                    });
                    const mobileTrack = document.getElementById('mobile-tab-track');
                    if (mobileTrack) {
                        const mobileTab = mobileTrack.querySelector(`[data-tab-target="${tabId}"]`);
                        if (mobileTab) {
                            const tabIndex = Array.from(mobileTrack.querySelectorAll('.mobile-tab')).indexOf(mobileTab);
                            if (tabIndex >= 0) updateMobileTabPage(Math.max(0, tabIndex - 3));
                        }
                    }
                    if (tabId === 'analytics' && typeof renderTransactionsAndMetrics === 'function') {
                        renderTransactionsAndMetrics();
                    }

                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                const sidebarDesktopQuery = window.matchMedia('(min-width: 1024px)');
                document.addEventListener('DOMContentLoaded', () => setSidebarOpen(sidebarDesktopQuery.matches));
                sidebarDesktopQuery.addEventListener('change', (event) => setSidebarOpen(event.matches));

                document.getElementById('sidebar-nav').addEventListener('click', (event) => {
                    if (!sidebarDesktopQuery.matches && event.target.closest('a, button')) setSidebarOpen(false);
                });

                document.addEventListener('click', (event) => {
                    const tab = event.target.closest('[data-tab-target]');
                    if (tab) setActiveTab(tab.dataset.tabTarget);
                });

                let mobileTabPage = 0;

                function updateMobileTabPage(page) {
                    const mobileTabTrack = document.getElementById('mobile-tab-track');
                    if (!mobileTabTrack) return;
                    const tabCount = mobileTabTrack.querySelectorAll('.mobile-tab').length;
                    const maxPage = Math.max(0, tabCount - 4);
                    mobileTabPage = Math.max(0, Math.min(maxPage, page));
                    const tabWidth = mobileTabTrack.parentElement.clientWidth / 4;
                    mobileTabTrack.style.transform = `translate3d(${-mobileTabPage * tabWidth}px, 0, 0)`;
                    const tabs = Array.from(mobileTabTrack.querySelectorAll('.mobile-tab'));
                    tabs.forEach((tab) => tab.classList.remove(
                        'mobile-tab-position-1',
                        'mobile-tab-position-2',
                        'mobile-tab-position-3',
                        'mobile-tab-position-4'
                    ));
                    tabs[mobileTabPage]?.classList.add('mobile-tab-position-1');
                    tabs[mobileTabPage + 1]?.classList.add('mobile-tab-position-2');
                    tabs[mobileTabPage + 2]?.classList.add('mobile-tab-position-3');
                    tabs[mobileTabPage + 3]?.classList.add('mobile-tab-position-4');
                    const mobileTabPrev = document.getElementById('mobile-tab-prev');
                    const mobileTabNext = document.getElementById('mobile-tab-next');
                    if (mobileTabPrev && !mobileTabPrev.classList.contains('is-exiting-prev')) {
                        mobileTabPrev.classList.toggle('is-at-start', mobileTabPage === 0);
                    }
                    if (mobileTabNext && !mobileTabNext.classList.contains('is-exiting-next')) {
                        mobileTabNext.classList.toggle('is-at-end', mobileTabPage === maxPage);
                    }
                }

                document.addEventListener('DOMContentLoaded', () => {
                    const mobileTabList = document.getElementById('mobile-tab-list');
                    const mobileTabPrev = document.getElementById('mobile-tab-prev');
                    const mobileTabNext = document.getElementById('mobile-tab-next');
                    let swipeStartX = 0;
                    let swipeStartY = 0;
                    let activePointerId = null;
                    let suppressTabClick = false;

                    function animateArrow(button, direction, exits) {
                        if (!button) return;
                        const movingClass = `is-moving-${direction}`;
                        const exitingClass = `is-exiting-${direction}`;
                        button.classList.remove('is-moving-next', 'is-moving-prev', 'is-exiting-next', 'is-exiting-prev');
                        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                            if (exits) button.classList.add(direction === 'next' ? 'is-at-end' : 'is-at-start');
                            return;
                        }
                        void button.offsetWidth;
                        if (exits) {
                            button.classList.add(exitingClass);
                            button.addEventListener('animationend', () => {
                                button.classList.remove(exitingClass);
                                button.classList.add(direction === 'next' ? 'is-at-end' : 'is-at-start');
                            }, { once: true });
                        } else {
                            button.classList.add(movingClass);
                            button.addEventListener('animationend', () => button.classList.remove(movingClass), { once: true });
                        }
                    }

                    mobileTabPrev?.addEventListener('click', () => {
                        const targetPage = Math.max(0, mobileTabPage - 1);
                        animateArrow(mobileTabPrev, 'prev', targetPage === 0);
                        updateMobileTabPage(targetPage);
                    });
                    mobileTabNext?.addEventListener('click', () => {
                        const tabCount = mobileTabList.querySelectorAll('.mobile-tab').length;
                        const maxPage = Math.max(0, tabCount - 4);
                        const targetPage = Math.min(maxPage, mobileTabPage + 1);
                        animateArrow(mobileTabNext, 'next', targetPage === maxPage);
                        updateMobileTabPage(targetPage);
                    });
                    mobileTabList?.addEventListener('pointerdown', (event) => {
                        if (event.button !== 0) return;
                        suppressTabClick = false;
                        activePointerId = event.pointerId;
                        swipeStartX = event.clientX;
                        swipeStartY = event.clientY;
                        mobileTabList.setPointerCapture(event.pointerId);
                    });
                    mobileTabList?.addEventListener('pointerup', (event) => {
                        if (event.pointerId !== activePointerId) return;
                        const dx = event.clientX - swipeStartX;
                        const dy = event.clientY - swipeStartY;
                        activePointerId = null;
                        if (Math.abs(dx) < 32 || Math.abs(dx) <= Math.abs(dy)) return;
                        event.preventDefault();
                        suppressTabClick = true;
                        updateMobileTabPage(mobileTabPage + (dx < 0 ? 1 : -1));
                        window.setTimeout(() => { suppressTabClick = false; }, 500);
                    });
                    mobileTabList?.addEventListener('pointercancel', () => { activePointerId = null; });
                    mobileTabList?.addEventListener('click', (event) => {
                        if (!suppressTabClick) return;
                        suppressTabClick = false;
                        event.preventDefault();
                        event.stopPropagation();
                    }, true);
                    window.addEventListener('resize', () => updateMobileTabPage(mobileTabPage));
                    updateMobileTabPage(0);
                });

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        closeUtilityModal('recommender-modal');
                        closeUtilityModal('import-modal');
                        setSidebarOpen(false);
                    }
                });
