const dashboard = {
    business: null,

    async init() {
        if (!auth.user) {
            router.navigate('login');
            return null;
        }

        const { data, error } = await supabaseClient
            .from('businesses')
            .select('*')
            .eq('owner_id', auth.user.id)
            .maybeSingle();

        if (error) {
            console.error('Error loading business:', error);
            return null;
        }
        this.business = data;
        return data;
    },

    async render() {
        const biz = await this.init();
        const mainContent = document.getElementById('main-content');

        if (!biz) {
            mainContent.innerHTML = `
                <div class="card text-center" style="margin-top: 2rem;">
                    <h2>No tienes un negocio registrado</h2>
                    <p>Si eres dueño de un negocio, contacta con soporte para activarlo.</p>
                    <button class="btn btn-primary mt-4" onclick="router.navigate('home')">Volver al Inicio</button>
                </div>
            `;
            return;
        }

        mainContent.innerHTML = `
            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h1>Panel: <span style="color: #60a5fa;">${biz.name}</span></h1>
                <div class="flex gap-4">
                    <button class="btn btn-outline" onclick="router.navigate('business', { id: '${biz.id}' })">Ver Perfil Público</button>
                </div>
            </div>

            <div class="mosaic-grid">
                <!-- Estadísticas -->
                <button class="tile tile-2x1 tile-blue" onclick="dashboard.viewSection('stats')">
                    <div class="tile-content">
                        <div class="tile-icon">📊</div>
                        <div class="tile-info">
                            <span class="tile-title">Vistas de Perfil</span>
                            <span class="tile-value" id="stat-total-views">...</span>
                        </div>
                    </div>
                </button>

                <!-- Servicios -->
                <button class="tile tile-1x1 tile-pink" onclick="dashboard.viewSection('services')">
                    <div class="tile-content">
                        <div class="tile-icon">✂️</div>
                        <span class="tile-title">Servicios</span>
                    </div>
                </button>

                <!-- Promociones -->
                <button class="tile tile-1x1 tile-green" onclick="dashboard.viewSection('promotions')">
                    <div class="tile-content">
                        <div class="tile-icon">🏷️</div>
                        <span class="tile-title">Promociones</span>
                    </div>
                </button>

                <!-- Inventario -->
                <button class="tile tile-1x1 tile-yellow" onclick="dashboard.viewSection('inventory')">
                    <div class="tile-content">
                        <div class="tile-icon">📦</div>
                        <span class="tile-title">Inventario</span>
                    </div>
                </button>

                <!-- Notas -->
                <button class="tile tile-1x1 tile-purple" onclick="dashboard.viewSection('notes')">
                    <div class="tile-content">
                        <div class="tile-icon">📝</div>
                        <span class="tile-title">Notas</span>
                    </div>
                </button>

                <!-- Archivos -->
                <button class="tile tile-1x1 tile-orange" onclick="dashboard.viewSection('files')">
                    <div class="tile-content">
                        <div class="tile-icon">📁</div>
                        <span class="tile-title">Archivos</span>
                    </div>
                </button>

                <!-- Perfil -->
                <button class="tile tile-1x1 tile-blue" onclick="dashboard.viewSection('info')" style="background-color: #fdf2f2;">
                    <div class="tile-content">
                        <div class="tile-icon">🏪</div>
                        <span class="tile-title">Mi Negocio</span>
                    </div>
                </button>
            </div>

            <div id="dashboard-details" class="mt-4" style="min-height: 400px; padding-top: 2rem;">
                <div class="card text-center" style="background: #f8fafc; border: 2px dashed #e2e8f0;">
                    <p>Selecciona una opción del mosaico para gestionar tu negocio</p>
                </div>
            </div>
        `;

        this.loadQuickStats();
    },

    async loadQuickStats() {
        const { count, error } = await supabaseClient
            .from('statistics')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', this.business.id)
            .eq('event_type', 'profile_view');

        if (!error) {
            document.getElementById('stat-total-views').textContent = count || 0;
        }
    },

    async viewSection(section) {
        const details = document.getElementById('dashboard-details');
        details.innerHTML = '<div class="text-center py-10">Cargando sección...</div>';

        switch(section) {
            case 'services': await this.renderServices(); break;
            case 'promotions': await this.renderPromotions(); break;
            case 'inventory': await this.renderInventory(); break;
            case 'notes': await this.renderNotes(); break;
            case 'files': await this.renderFiles(); break;
            case 'stats': await this.renderStats(); break;
            case 'info': await this.renderInfo(); break;
        }

        details.scrollIntoView({ behavior: 'smooth' });
    },

    // --- SERVICES ---
    async renderServices() {
        const { data: services } = await supabaseClient.from('services').select('*').eq('business_id', this.business.id).order('created_at', { ascending: false });

        document.getElementById('dashboard-details').innerHTML = `
            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Gestión de Servicios</h2>
                <button class="btn btn-primary" onclick="dashboard.showServiceForm()">+ Nuevo Servicio</button>
            </div>
            <div class="grid gap-4">
                ${services?.map(s => `
                    <div class="card flex" style="justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 1.1rem;">${s.name}</strong>
                            <span style="margin-left: 10px; color: #10b981; font-weight: bold;">${helpers.formatCurrency(s.price)}</span>
                            <p style="font-size: 0.85rem; color: #6b7280; margin-top: 0.25rem;">${s.description || 'Sin descripción'}</p>
                            <span class="badge" style="background: ${s.is_active ? '#dcfce7' : '#f3f4f6'}; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;">
                                ${s.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-outline" onclick='dashboard.showServiceForm(${JSON.stringify(s).replace(/'/g, "&apos;")})'>Editar</button>
                            <button class="btn" style="background: #fee2e2; color: #b91c1c; border: none;" onclick="dashboard.deleteService(${s.id})">Eliminar</button>
                        </div>
                    </div>
                `).join('') || '<p class="text-center py-10">No tienes servicios registrados.</p>'}
            </div>
        `;
    },

    showServiceForm(service = null) {
        const details = document.getElementById('dashboard-details');
        details.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 0 auto;">
                <h3>${service ? 'Editar' : 'Nuevo'} Servicio</h3>
                <form onsubmit="dashboard.handleServiceSubmit(event, ${service?.id || 'null'})" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Nombre del servicio</label>
                        <input type="text" id="svc-name" value="${service?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Precio</label>
                        <input type="number" step="0.01" id="svc-price" value="${service?.price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea id="svc-desc" rows="3">${service?.description || ''}</textarea>
                    </div>
                    <div class="form-group flex gap-2" style="align-items: center;">
                        <input type="checkbox" id="svc-active" ${service ? (service.is_active ? 'checked' : '') : 'checked'} style="width: auto;">
                        <label style="margin-bottom: 0;">Servicio activo</label>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar</button>
                        <button type="button" class="btn btn-outline" onclick="dashboard.renderServices()" style="flex: 1;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    },

    async handleServiceSubmit(e, id) {
        e.preventDefault();
        const payload = {
            business_id: this.business.id,
            name: document.getElementById('svc-name').value,
            price: parseFloat(document.getElementById('svc-price').value),
            description: document.getElementById('svc-desc').value,
            is_active: document.getElementById('svc-active').checked
        };

        try {
            if (id) {
                await supabaseClient.from('services').update(payload).eq('id', id);
                app.showToast('Servicio actualizado');
            } else {
                await supabaseClient.from('services').insert([payload]);
                app.showToast('Servicio creado');
            }
            this.renderServices();
        } catch (err) {
            app.showToast(err.message, 'error');
        }
    },

    async deleteService(id) {
        if (!confirm('¿Seguro que quieres eliminar este servicio?')) return;
        try {
            await supabaseClient.from('services').delete().eq('id', id);
            app.showToast('Servicio eliminado');
            this.renderServices();
        } catch (err) {
            app.showToast(err.message, 'error');
        }
    },

    // --- PROMOTIONS ---
    async renderPromotions() {
        const { data: promos } = await supabaseClient.from('promotions').select('*').eq('business_id', this.business.id).order('created_at', { ascending: false });

        document.getElementById('dashboard-details').innerHTML = `
            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Gestión de Promociones</h2>
                <button class="btn btn-primary" onclick="dashboard.showPromoForm()">+ Nueva Promo</button>
            </div>
            <div class="grid gap-4">
                ${promos?.map(p => `
                    <div class="card flex" style="justify-content: space-between; align-items: center; border-left: 5px solid #60a5fa;">
                        <div>
                            <strong style="font-size: 1.1rem;">${p.title}</strong>
                            <span class="badge" style="background: #e0f2fe; margin-left: 10px;">${p.type}</span>
                            <p style="font-size: 0.85rem; color: #6b7280; margin-top: 0.25rem;">${p.description || 'Sin descripción'}</p>
                            ${p.code ? `<code style="background: #f1f5f9; padding: 2px 5px; border-radius: 4px;">Código: ${p.code}</code>` : ''}
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-outline" onclick='dashboard.showPromoForm(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Editar</button>
                            <button class="btn" style="background: #fee2e2; color: #b91c1c; border: none;" onclick="dashboard.deletePromo('${p.id}')">Eliminar</button>
                        </div>
                    </div>
                `).join('') || '<p class="text-center py-10">No tienes promociones activas.</p>'}
            </div>
        `;
    },

    showPromoForm(promo = null) {
        const details = document.getElementById('dashboard-details');
        details.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 0 auto;">
                <h3>${promo ? 'Editar' : 'Nueva'} Promoción</h3>
                <form onsubmit="dashboard.handlePromoSubmit(event, ${promo ? `'${promo.id}'` : 'null'})" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Título de la promo</label>
                        <input type="text" id="prm-title" value="${promo?.title || ''}" required placeholder="Ej. 2x1 en Pizzas">
                    </div>
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="prm-type">
                            <option value="coupon" ${promo?.type === 'coupon' ? 'selected' : ''}>Cupón</option>
                            <option value="scratch" ${promo?.type === 'scratch' ? 'selected' : ''}>Rasca y Gana</option>
                            <option value="roulette" ${promo?.type === 'roulette' ? 'selected' : ''}>Ruleta</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea id="prm-desc" rows="2">${promo?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Código (opcional)</label>
                        <input type="text" id="prm-code" value="${promo?.code || ''}">
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar</button>
                        <button type="button" class="btn btn-outline" onclick="dashboard.renderPromotions()" style="flex: 1;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    },

    async handlePromoSubmit(e, id) {
        e.preventDefault();
        const payload = {
            business_id: this.business.id,
            title: document.getElementById('prm-title').value,
            type: document.getElementById('prm-type').value,
            description: document.getElementById('prm-desc').value,
            code: document.getElementById('prm-code').value,
            is_active: true
        };

        try {
            if (id) {
                await supabaseClient.from('promotions').update(payload).eq('id', id);
                app.showToast('Promoción actualizada');
            } else {
                await supabaseClient.from('promotions').insert([payload]);
                app.showToast('Promoción creada');
            }
            this.renderPromotions();
        } catch (err) {
            app.showToast(err.message, 'error');
        }
    },

    async deletePromo(id) {
        if (!confirm('¿Seguro?')) return;
        try {
            await supabaseClient.from('promotions').delete().eq('id', id);
            app.showToast('Promo eliminada');
            this.renderPromotions();
        } catch (err) {
            app.showToast(err.message, 'error');
        }
    },
    // --- INVENTORY ---
    async renderInventory() {
        const { data: items } = await supabaseClient.from('inventory').select('*').eq('business_id', this.business.id).order('updated_at', { ascending: false });

        document.getElementById('dashboard-details').innerHTML = `
            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Control de Inventario</h2>
                <button class="btn btn-primary" onclick="dashboard.showInventoryForm()">+ Añadir Item</button>
            </div>
            <div class="grid gap-4">
                ${items?.map(item => `
                    <div class="card flex" style="justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="font-size: 1.1rem;">${item.name}</strong>
                            <p style="font-size: 0.85rem; color: #6b7280;">${item.description || 'Sin descripción'}</p>
                            <div class="mt-2">
                                <span class="badge" style="background: #fefce8; color: #854d0e;">Stock: ${item.quantity}</span>
                                <span class="badge" style="background: #f1f5f9; margin-left: 5px;">${item.status}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-outline" onclick='dashboard.showInventoryForm(${JSON.stringify(item).replace(/'/g, "&apos;")})'>Editar</button>
                            <button class="btn" style="background: #fee2e2; color: #b91c1c; border: none;" onclick="dashboard.deleteInventory(${item.id})">Borrar</button>
                        </div>
                    </div>
                `).join('') || '<p class="text-center py-10">No hay items en el inventario.</p>'}
            </div>
        `;
    },

    showInventoryForm(item = null) {
        const details = document.getElementById('dashboard-details');
        details.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 0 auto;">
                <h3>${item ? 'Editar' : 'Nuevo'} Item de Inventario</h3>
                <form onsubmit="dashboard.handleInventorySubmit(event, ${item?.id || 'null'})" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Nombre del producto/item</label>
                        <input type="text" id="inv-name" value="${item?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Cantidad</label>
                        <input type="number" id="inv-qty" value="${item?.quantity || 0}" required>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select id="inv-status">
                            <option value="available" ${item?.status === 'available' ? 'selected' : ''}>Disponible</option>
                            <option value="out_of_stock" ${item?.status === 'out_of_stock' ? 'selected' : ''}>Agotado</option>
                        </select>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar</button>
                        <button type="button" class="btn btn-outline" onclick="dashboard.renderInventory()" style="flex: 1;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    },

    async handleInventorySubmit(e, id) {
        e.preventDefault();
        const payload = {
            business_id: this.business.id,
            name: document.getElementById('inv-name').value,
            quantity: parseInt(document.getElementById('inv-qty').value),
            status: document.getElementById('inv-status').value,
            updated_at: new Date().toISOString()
        };
        try {
            if (id) {
                await supabaseClient.from('inventory').update(payload).eq('id', id);
            } else {
                await supabaseClient.from('inventory').insert([payload]);
            }
            app.showToast('Inventario actualizado');
            this.renderInventory();
        } catch (err) { app.showToast(err.message, 'error'); }
    },

    async deleteInventory(id) {
        if (!confirm('¿Eliminar item?')) return;
        await supabaseClient.from('inventory').delete().eq('id', id);
        this.renderInventory();
    },

    // --- NOTES ---
    async renderNotes() {
        const { data: notes } = await supabaseClient.from('notes').select('*').eq('business_id', this.business.id).order('is_pinned', { ascending: false });

        document.getElementById('dashboard-details').innerHTML = `
            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Notas Internas</h2>
                <button class="btn btn-primary" onclick="dashboard.showNoteForm()">+ Nueva Nota</button>
            </div>
            <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">
                ${notes?.map(n => `
                    <div class="card" style="background: ${n.is_pinned ? '#fefce8' : 'white'}; position: relative;">
                        ${n.is_pinned ? '<span style="position: absolute; top: 10px; right: 10px;">📌</span>' : ''}
                        <h3>${n.title}</h3>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem; white-space: pre-wrap;">${n.content}</p>
                        <div class="flex gap-2 mt-4">
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick='dashboard.showNoteForm(${JSON.stringify(n).replace(/'/g, "&apos;")})'>Editar</button>
                            <button class="btn" style="padding: 4px 8px; font-size: 0.8rem; background: #fee2e2; color: #b91c1c;" onclick="dashboard.deleteNote(${n.id})">Borrar</button>
                        </div>
                    </div>
                `).join('') || '<p>No hay notas guardadas.</p>'}
            </div>
        `;
    },

    showNoteForm(note = null) {
        const details = document.getElementById('dashboard-details');
        details.innerHTML = `
            <div class="card" style="max-width: 500px; margin: 0 auto;">
                <h3>${note ? 'Editar' : 'Nueva'} Nota</h3>
                <form onsubmit="dashboard.handleNoteSubmit(event, ${note?.id || 'null'})" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" id="note-title" value="${note?.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Contenido</label>
                        <textarea id="note-content" rows="5" required>${note?.content || ''}</textarea>
                    </div>
                    <div class="form-group flex gap-2" style="align-items: center;">
                        <input type="checkbox" id="note-pinned" ${note?.is_pinned ? 'checked' : ''} style="width: auto;">
                        <label style="margin-bottom: 0;">Fijar nota al principio</label>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar</button>
                        <button type="button" class="btn btn-outline" onclick="dashboard.renderNotes()" style="flex: 1;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
    },

    async handleNoteSubmit(e, id) {
        e.preventDefault();
        const payload = {
            business_id: this.business.id,
            user_id: auth.user.id,
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value,
            is_pinned: document.getElementById('note-pinned').checked
        };
        try {
            if (id) await supabaseClient.from('notes').update(payload).eq('id', id);
            else await supabaseClient.from('notes').insert([payload]);
            this.renderNotes();
        } catch (err) { app.showToast(err.message, 'error'); }
    },

    async deleteNote(id) {
        if (!confirm('¿Eliminar nota?')) return;
        await supabaseClient.from('notes').delete().eq('id', id);
        this.renderNotes();
    },

    // --- FILES ---
    async renderFiles() {
        const { data: files } = await supabaseClient.from('files').select('*').eq('business_id', this.business.id).order('created_at', { ascending: false });

        document.getElementById('dashboard-details').innerHTML = `
            <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2>Documentos y Archivos</h2>
                <div>
                    <input type="file" id="file-upload" style="display: none;" onchange="dashboard.handleFileUpload(event)">
                    <button class="btn btn-primary" onclick="document.getElementById('file-upload').click()">+ Subir Archivo</button>
                </div>
            </div>
            <div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                ${files?.map(f => `
                    <div class="card text-center">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                        <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</strong>
                        <div class="flex gap-2 mt-4">
                            <a href="${f.file_url}" target="_blank" class="btn btn-outline" style="flex: 1; padding: 5px; font-size: 0.8rem;">Ver</a>
                            <button class="btn" style="flex: 1; padding: 5px; font-size: 0.8rem; background: #fee2e2; color: #b91c1c;" onclick="dashboard.deleteFile('${f.id}', '${f.file_url}')">Borrar</button>
                        </div>
                    </div>
                `).join('') || '<p>No hay archivos subidos.</p>'}
            </div>
        `;
    },

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${this.business.id}/${fileName}`;

        try {
            app.showToast('Subiendo archivo...');
            const { data, error } = await supabaseClient.storage
                .from('business-files')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabaseClient.storage
                .from('business-files')
                .getPublicUrl(filePath);

            await supabaseClient.from('files').insert([{
                business_id: this.business.id,
                name: file.name,
                file_url: publicUrl,
                file_type: file.type
            }]);

            app.showToast('Archivo subido con éxito');
            this.renderFiles();
        } catch (err) {
            app.showToast(err.message, 'error');
        }
    },

    async deleteFile(id, url) {
        if (!confirm('¿Eliminar archivo?')) return;
        try {
            // Extract path from URL (simplified)
            const path = url.split('business-files/').pop();
            await supabaseClient.storage.from('business-files').remove([path]);
            await supabaseClient.from('files').delete().eq('id', id);
            app.showToast('Archivo eliminado');
            this.renderFiles();
        } catch (err) { app.showToast(err.message, 'error'); }
    },
    async renderStats() {
        const { data: stats } = await supabaseClient.from('statistics').select('*').eq('business_id', this.business.id);

        const counts = {
            profile_view: 0,
            whatsapp_click: 0,
            call_click: 0,
            web_click: 0
        };

        stats?.forEach(s => {
            if (counts[s.event_type] !== undefined) counts[s.event_type]++;
        });

        document.getElementById('dashboard-details').innerHTML = `
            <h2>Estadísticas Detalladas</h2>
            <div class="grid gap-4 mt-4" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="card text-center" style="background: #e0f2fe; border: none;">
                    <span style="font-size: 2.5rem;">👁️</span>
                    <h3 style="margin-top: 10px;">Vistas de Perfil</h3>
                    <p style="font-size: 2rem; font-weight: 800; color: #0369a1;">${counts.profile_view}</p>
                </div>
                <div class="card text-center" style="background: #dcfce7; border: none;">
                    <span style="font-size: 2.5rem;">💬</span>
                    <h3 style="margin-top: 10px;">Clics WhatsApp</h3>
                    <p style="font-size: 2rem; font-weight: 800; color: #166534;">${counts.whatsapp_click}</p>
                </div>
                <div class="card text-center" style="background: #fee2e2; border: none;">
                    <span style="font-size: 2.5rem;">📞</span>
                    <h3 style="margin-top: 10px;">Clics Llamada</h3>
                    <p style="font-size: 2rem; font-weight: 800; color: #991b1b;">${counts.call_click}</p>
                </div>
                <div class="card text-center" style="background: #fefce8; border: none;">
                    <span style="font-size: 2.5rem;">🌐</span>
                    <h3 style="margin-top: 10px;">Clics Web</h3>
                    <p style="font-size: 2rem; font-weight: 800; color: #854d0e;">${counts.web_click}</p>
                </div>
            </div>
        `;
    },

    async renderInfo() {
        const biz = this.business;
        document.getElementById('dashboard-details').innerHTML = `
            <div class="card" style="max-width: 600px; margin: 0 auto;">
                <h2>Información del Negocio</h2>
                <form onsubmit="dashboard.handleInfoUpdate(event)" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="biz-name" value="${biz.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea id="biz-desc" rows="3">${biz.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" id="biz-addr" value="${biz.address || ''}">
                    </div>
                    <div class="form-group">
                        <label>WhatsApp</label>
                        <input type="text" id="biz-wa" value="${biz.whatsapp || ''}" placeholder="Ej. 34600000000">
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="text" id="biz-phone" value="${biz.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Sitio Web</label>
                        <input type="url" id="biz-web" value="${biz.website || ''}">
                    </div>
                    <div class="form-group">
                        <label>URL del Logo</label>
                        <input type="url" id="biz-logo" value="${biz.logo_url || ''}">
                    </div>
                    <div class="form-group">
                        <label>URL del Banner</label>
                        <input type="url" id="biz-banner" value="${biz.banner_url || ''}">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Actualizar Información</button>
                </form>
            </div>
        `;
    },

    async handleInfoUpdate(e) {
        e.preventDefault();
        const payload = {
            name: document.getElementById('biz-name').value,
            description: document.getElementById('biz-desc').value,
            address: document.getElementById('biz-addr').value,
            whatsapp: document.getElementById('biz-wa').value,
            phone: document.getElementById('biz-phone').value,
            website: document.getElementById('biz-web').value,
            logo_url: document.getElementById('biz-logo').value,
            banner_url: document.getElementById('biz-banner').value,
            updated_at: new Date().toISOString()
        };

        try {
            const { error } = await supabaseClient.from('businesses').update(payload).eq('id', this.business.id);
            if (error) throw error;
            app.showToast('Información actualizada!');
            this.business = { ...this.business, ...payload };
            this.render();
        } catch (err) { app.showToast(err.message, 'error'); }
    }
};

// Expose views.dashboard
if (typeof views !== 'undefined') {
    views.dashboard = () => dashboard.render();
}
