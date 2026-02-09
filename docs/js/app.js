const router = {
    routes: {},
    init() {
        this.routes = {
            'home': views.home,
            'login': views.login,
            'signup': views.signup,
            'business': views.businessProfile,
            'dashboard': views.dashboard,
            'search': views.searchResults,
            'register-business': views.registerBusiness,
            'admin': views.admin,
        };
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },
    navigate(route, params) {
        let hash = `#${route}`;
        if (params) {
            const query = new URLSearchParams(params).toString();
            hash += `?${query}`;
        }
        window.location.hash = hash;
    },
    async handleRoute() {
        const hash = window.location.hash.substring(1) || 'home';
        const [route, queryString] = hash.split('?');
        const params = new URLSearchParams(queryString);

        const viewFn = this.routes[route] || this.routes['home'];
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div id="loader" class="text-center py-20">Cargando...</div>';
        mainContent.classList.remove('view-fade-in');

        try {
            await viewFn(params);
            mainContent.classList.add('view-fade-in');
        } catch (error) {
            console.error('Error rendering view:', error);
            mainContent.innerHTML = `<div class="error text-center py-20">Error al cargar la vista: ${error.message}</div>`;
        }
    }
};

const app = {
    async init() {
        await auth.init();
        router.init();
        this.updateAuthUI();
    },
    updateAuthUI() {
        const authLinks = document.getElementById('auth-links');
        if (auth.user) {
            let links = '';
            if (auth.isAdmin()) {
                links += '<a href="#admin">Admin</a>';
            }
            if (auth.isOwner()) {
                links += '<a href="#dashboard">Panel</a>';
            } else if (!auth.isAdmin()) {
                links += '<a href="#register-business">Registrar Negocio</a>';
            }
            links += '<a href="#" onclick="auth.signOut()">Salir</a>';
            authLinks.innerHTML = links;
        } else {
            authLinks.innerHTML = `
                <a href="#login">Entrar</a>
                <a href="#signup">Registrarse</a>
            `;
        }
    },
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
};

const views = {
    async home() {
        const mainContent = document.getElementById('main-content');
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*');

        mainContent.innerHTML = `
            <section class="hero">
                <h1>Descubre servicios locales</h1>
                <p>Calidad y estilo pastel en un solo lugar.</p>
            </section>
            <div class="search-bar">
                <input type="text" id="search-input" placeholder="¿Qué buscas hoy? (ej. Pizza, Peluquería)">
                <button class="btn btn-primary" onclick="views.handleSearch()">Buscar</button>
            </div>
            <div class="container">
                <h2 class="text-center mt-4">Categorías</h2>
                <div class="category-grid">
                    ${categories?.map(cat => `
                        <div class="category-card" onclick="router.navigate('search', { category_id: '${cat.id}' })">
                            <div class="category-icon">${cat.icon_url ? `<img src="${cat.icon_url}" alt="${cat.name}" width="40">` : '✨'}</div>
                            <h3>${cat.name}</h3>
                        </div>
                    `).join('') || '<p class="text-center">No hay categorías disponibles.</p>'}
                </div>
            </div>
        `;
    },

    handleSearch() {
        const query = document.getElementById('search-input').value;
        router.navigate('search', { q: query });
    },

    async login() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 2rem auto;">
                <h2 class="text-center">Iniciar Sesión</h2>
                <form id="login-form" onsubmit="views.handleLogin(event)">
                    <div class="form-group">
                        <label>Usuario</label>
                        <input type="text" id="login-username" required placeholder="Tu usuario">
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit" id="btn-login" class="btn btn-primary" style="width: 100%">Entrar</button>
                </form>
                <p class="text-center mt-4">¿No tienes cuenta? <a href="#signup">Regístrate gratis</a></p>
            </div>
        `;
    },

    async handleLogin(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        let user = document.getElementById('login-username').value.toLowerCase().trim();
        const password = document.getElementById('login-password').value;

        // Formato interno para Supabase
        const internalEmail = user.includes('@') ? user : `${user}@a.a`;

        try {
            await auth.signIn(internalEmail, password);
            app.showToast('¡Bienvenido!');
            router.navigate('home');
        } catch (err) {
            let msg = err.message;
            if (msg.includes('Invalid login credentials')) msg = 'Usuario o contraseña incorrectos';
            if (msg.toLowerCase().includes('email')) msg = msg.replace(/email/gi, 'usuario');
            if (msg.includes('rate limit')) msg = 'Demasiados intentos. Por favor, espera un minuto.';
            app.showToast(msg, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    },

    async signup() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 2rem auto;">
                <h2 class="text-center">Registrarse</h2>
                <p class="text-center" style="font-size: 0.9rem; color: #666; margin-bottom: 1.5rem;">Crea tu cuenta solo con un usuario</p>
                <form id="signup-form" onsubmit="views.handleSignup(event)">
                    <div class="form-group">
                        <label>Usuario</label>
                        <input type="text" id="signup-username" required placeholder="Ej. juanito123">
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="signup-password" required minlength="6" placeholder="Mínimo 6 caracteres">
                    </div>
                    <button type="submit" id="btn-signup" class="btn btn-primary" style="width: 100%">Crear Mi Cuenta</button>
                </form>
                <p class="text-center mt-4">¿Ya tienes cuenta? <a href="#login">Inicia sesión</a></p>
            </div>
        `;
    },

    async handleSignup(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-signup');
        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';

        const username = document.getElementById('signup-username').value.toLowerCase().trim();
        const password = document.getElementById('signup-password').value;

        // Formato interno corto para evitar límites de longitud
        const internalEmail = `${username}@a.a`;

        try {
            await auth.signUp(internalEmail, password, username);
            app.showToast('¡Cuenta creada! Ya puedes entrar.');
            router.navigate('login');
        } catch (err) {
            let msg = err.message;
            if (msg.toLowerCase().includes('email')) msg = msg.replace(/email/gi, 'usuario');
            if (msg.includes('rate limit')) msg = 'Demasiados intentos. Por favor, espera un minuto.';
            app.showToast(msg, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Crear Mi Cuenta';
        }
    },

    async trackEvent(businessId, eventType) {
        try {
            await supabaseClient.from('statistics').insert([
                { business_id: businessId, event_type: eventType, user_id: auth.user?.id }
            ]);
        } catch (e) {
            console.error('Error tracking event:', e);
        }
    },

    async trackClick(businessId, eventType, url) {
        await this.trackEvent(businessId, eventType);
        window.open(url, '_blank');
    },

    async toggleFavorite(businessId, isFavorite) {
        if (!auth.user) {
            app.showToast('Inicia sesión para añadir a favoritos', 'error');
            return;
        }
        try {
            if (isFavorite) {
                await supabaseClient.from('favorites').delete().eq('business_id', businessId).eq('user_id', auth.user.id);
                app.showToast('Quitado de favoritos');
            } else {
                await supabaseClient.from('favorites').insert([{ business_id: businessId, user_id: auth.user.id }]);
                app.showToast('Añadido a favoritos!');
            }
            router.handleRoute();
        } catch (e) {
            app.showToast(e.message, 'error');
        }
    },

    async handleReviewSubmit(e, businessId) {
        e.preventDefault();
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value;
        try {
            const { error } = await supabaseClient.from('reviews').insert([
                { business_id: businessId, user_id: auth.user.id, rating: parseInt(rating), comment }
            ]);
            if (error) throw error;
            app.showToast('Gracias por tu reseña!');
            router.handleRoute();
        } catch (e) {
            app.showToast('Ya has dejado una reseña para este negocio o hubo un error.', 'error');
        }
    },

    async businessProfile(params) {
        const id = params.get('id');
        const mainContent = document.getElementById('main-content');

        const { data: b, error: bErr } = await supabaseClient.from('businesses').select('*').eq('id', id).single();
        if (bErr) throw bErr;

        const { data: services } = await supabaseClient.from('services').select('*').eq('business_id', id).eq('is_active', true);
        const { data: reviews } = await supabaseClient.from('reviews').select('*, profiles(full_name)').eq('business_id', id);

        let isFavorite = false;
        if (auth.user) {
            const { data: fav } = await supabaseClient.from('favorites').select('*').eq('business_id', id).eq('user_id', auth.user.id).single();
            isFavorite = !!fav;
        }

        views.trackEvent(id, 'profile_view');

        mainContent.innerHTML = `
            <div class="business-header" style="position: relative; margin-bottom: 80px;">
                <div style="width: 100%; height: 250px; background: #e0f2fe; border-radius: 12px; overflow: hidden;">
                    <img src="${b.banner_url || 'https://via.placeholder.com/1000x300?text=Banner'}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="position: absolute; bottom: -50px; left: 30px;">
                    <img src="${b.logo_url || 'https://via.placeholder.com/120'}" style="width: 120px; height: 120px; border-radius: 50%; border: 5px solid white; background: white; object-fit: cover;">
                </div>
            </div>

            <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div>
                    <h1 style="font-size: 2.5rem;">${b.name}</h1>
                    <p style="color: #6b7280; margin-top: 0.5rem;">📍 ${b.address}</p>
                    <div style="margin-top: 1.5rem; font-size: 1.1rem;">${b.description || 'Sin descripción'}</div>

                    <h2 class="mt-4" style="border-bottom: 2px solid #fdf2f2; padding-bottom: 0.5rem;">Servicios</h2>
                    <div class="grid gap-4 mt-2">
                        ${services?.map(s => `
                            <div class="card flex" style="justify-content: space-between; align-items: center; padding: 1rem;">
                                <div>
                                    <strong style="font-size: 1.1rem;">${s.name}</strong>
                                    <p style="font-size: 0.85rem; color: #6b7280;">${s.description || ''}</p>
                                </div>
                                <span style="font-weight: 800; color: #60a5fa; font-size: 1.2rem;">${helpers.formatCurrency(s.price)}</span>
                            </div>
                        `).join('') || '<p>No hay servicios disponibles.</p>'}
                    </div>

                    <h2 class="mt-4" style="border-bottom: 2px solid #fdf2f2; padding-bottom: 0.5rem;">Reseñas</h2>
                    <div class="mt-2">
                        ${reviews?.map(r => `
                            <div class="card" style="padding: 1rem; margin-bottom: 1rem;">
                                <div class="flex" style="justify-content: space-between;">
                                    <strong>${r.profiles?.full_name || 'Usuario'}</strong>
                                    <span style="color: #fbbf24;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                                </div>
                                <p style="margin-top: 0.5rem;">${r.comment}</p>
                            </div>
                        `).join('') || '<p>Sin reseñas todavía.</p>'}
                    </div>

                    ${auth.user ? `
                        <div class="card mt-4" style="background: #f5f3ff;">
                            <h3>Deja tu reseña</h3>
                            <form onsubmit="views.handleReviewSubmit(event, '${id}')" style="margin-top: 1rem;">
                                <div class="form-group">
                                    <label>Calificación</label>
                                    <select id="review-rating">
                                        <option value="5">5 ★★★★★</option>
                                        <option value="4">4 ★★★★</option>
                                        <option value="3">3 ★★★</option>
                                        <option value="2">2 ★★</option>
                                        <option value="1">1 ★</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Tu comentario</label>
                                    <textarea id="review-comment" rows="3" required placeholder="Cuéntanos tu experiencia..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Publicar Reseña</button>
                            </form>
                        </div>
                    ` : `
                        <div class="card mt-4 text-center">
                            <p>Para dejar una reseña debes <a href="#login">iniciar sesión</a>.</p>
                        </div>
                    `}
                </div>

                <div class="sidebar">
                    <div class="card" style="position: sticky; top: 20px;">
                        <button class="btn ${isFavorite ? 'btn-outline' : 'btn-primary'}" onclick="views.toggleFavorite('${id}', ${isFavorite})" style="width: 100%; margin-bottom: 1.5rem;">
                            ${isFavorite ? '❤️ En mis favoritos' : '🤍 Añadir a favoritos'}
                        </button>

                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${b.phone ? `<button class="btn" style="background: #e0f2fe; color: #0369a1;" onclick="views.trackClick('${id}', 'call_click', 'tel:${b.phone}')">📞 Llamar</button>` : ''}
                            ${b.whatsapp ? `<button class="btn" style="background: #dcfce7; color: #166534;" onclick="views.trackClick('${id}', 'whatsapp_click', 'https://wa.me/${b.whatsapp}')">💬 WhatsApp</button>` : ''}
                            ${b.website ? `<button class="btn" style="background: #fdf2f2; color: #991b1b;" onclick="views.trackClick('${id}', 'web_click', '${b.website}')">🌐 Sitio Web</button>` : ''}
                        </div>

                        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
                            <p><strong>Ubicación</strong></p>
                            <p style="font-size: 0.9rem; color: #4b5563; margin-top: 0.5rem;">${b.address}</p>
                            <div style="height: 150px; background: #f3f4f6; border-radius: 8px; margin-top: 1rem; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
                                🗺️ Mapa (Próximamente)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async registerBusiness() {
        if (!auth.user) {
            router.navigate('login');
            return;
        }
        const mainContent = document.getElementById('main-content');
        const { data: categories } = await supabaseClient.from('categories').select('*');

        mainContent.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 2rem auto;">
                <h2 class="text-center">Registrar mi Negocio</h2>
                <p class="text-center mb-4">Empieza a gestionar tus servicios y clientes hoy mismo.</p>
                <form id="register-biz-form" onsubmit="views.handleRegisterBusiness(event)">
                    <div class="form-group">
                        <label>Nombre del Negocio</label>
                        <input type="text" id="reg-biz-name" required placeholder="Ej. Pastelería Central">
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="reg-biz-category" required>
                            <option value="">Selecciona una categoría</option>
                            ${categories?.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" id="reg-biz-addr" required placeholder="Calle Falsa 123">
                    </div>
                    <div class="form-group">
                        <label>Descripción Corta</label>
                        <textarea id="reg-biz-desc" rows="3" required placeholder="Cuéntanos qué ofreces..."></textarea>
                    </div>
                    <button type="submit" id="btn-reg-biz" class="btn btn-primary" style="width: 100%">Crear Mi Negocio</button>
                </form>
            </div>
        `;
    },

    async handleRegisterBusiness(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-reg-biz');
        btn.disabled = true;
        btn.textContent = 'Creando...';

        const payload = {
            owner_id: auth.user.id,
            name: document.getElementById('reg-biz-name').value,
            category_id: document.getElementById('reg-biz-category').value,
            address: document.getElementById('reg-biz-addr').value,
            description: document.getElementById('reg-biz-desc').value,
        };

        try {
            const { error: bizError } = await supabaseClient.from('businesses').insert([payload]);
            if (bizError) throw bizError;

            // Update user role to owner
            const { error: roleError } = await supabaseClient
                .from('profiles')
                .update({ role: 'owner' })
                .eq('id', auth.user.id);
            if (roleError) throw roleError;

            // Refresh profile in memory
            await auth.loadProfile();

            app.showToast('¡Negocio registrado con éxito!');
            router.navigate('dashboard');
        } catch (err) {
            app.showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Crear Mi Negocio';
        }
    },

    async admin() {
        if (!auth.isAdmin()) {
            router.navigate('home');
            return;
        }
        const mainContent = document.getElementById('main-content');

        const { data: profiles } = await supabaseClient.from('profiles').select('*');
        const { data: businesses } = await supabaseClient.from('businesses').select('*, profiles(full_name)');

        mainContent.innerHTML = `
            <h1>Panel Global de Administración</h1>

            <div class="grid gap-6 mt-6" style="grid-template-columns: 1fr 1fr;">
                <div class="card">
                    <h2 class="mb-4">Usuarios (${profiles?.length || 0})</h2>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #eee; text-align: left;">
                                    <th style="padding: 8px;">Nombre</th>
                                    <th style="padding: 8px;">Rol</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${profiles?.map(p => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 8px;">${p.full_name}</td>
                                        <td style="padding: 8px;"><span class="badge" style="background: #f3f4f6;">${p.role}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h2 class="mb-4">Negocios (${businesses?.length || 0})</h2>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #eee; text-align: left;">
                                    <th style="padding: 8px;">Negocio</th>
                                    <th style="padding: 8px;">Dueño</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${businesses?.map(b => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 8px;">${b.name}</td>
                                        <td style="padding: 8px;">${b.profiles?.full_name || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async searchResults(params) {
        const query = params.get('q') || '';
        const categoryId = params.get('category_id');
        const mainContent = document.getElementById('main-content');

        let dbQuery = supabaseClient.from('businesses').select('*, categories(*)');

        if (query) {
            dbQuery = dbQuery.ilike('name', `%${query}%`);
        }
        if (categoryId) {
            dbQuery = dbQuery.eq('category_id', categoryId);
        }

        const { data: businesses, error } = await dbQuery;

        // Geolocation
        let userCoords = null;
        if ("geolocation" in navigator) {
            try {
                userCoords = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        pos => resolve(pos.coords),
                        err => resolve(null),
                        { timeout: 3000 }
                    );
                });
            } catch (e) {}
        }

        if (userCoords && businesses) {
            businesses.forEach(b => {
                if (b.latitude && b.longitude) {
                    b.distance = helpers.calculateDistance(
                        userCoords.latitude, userCoords.longitude,
                        b.latitude, b.longitude
                    );
                } else {
                    b.distance = Infinity;
                }
            });
            businesses.sort((a, b) => a.distance - b.distance);
        }

        mainContent.innerHTML = `
            <h2>Resultados ${query ? `para "${query}"` : ''}</h2>
            <div class="business-list mt-4">
                ${businesses?.map(b => `
                    <div class="business-card" onclick="router.navigate('business', { id: '${b.id}' })" style="cursor: pointer;">
                        <img src="${b.logo_url || 'https://via.placeholder.com/300x180?text=Negocio'}" alt="${b.name}">
                        <div class="business-info">
                            <h3>${b.name}</h3>
                            <p>${b.description?.substring(0, 100) || 'Sin descripción'}...</p>
                            <div class="flex" style="justify-content: space-between; align-items: center; margin-top: 1rem;">
                                <span style="font-size: 0.9rem; color: #6b7280;">📍 ${b.address || 'Sin dirección'}</span>
                                ${b.distance !== undefined && b.distance !== Infinity ?
                                    `<span class="badge" style="background: #e0f2fe; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">${b.distance.toFixed(1)} km</span>`
                                    : ''}
                            </div>
                        </div>
                    </div>
                `).join('') || '<p>No se encontraron negocios.</p>'}
            </div>
        `;
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => app.init());
