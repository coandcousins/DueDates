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

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        closeUtilityModal('recommender-modal');
                        closeUtilityModal('import-modal');
                        setSidebarOpen(false);
                    }
                });
