const auth = {
    user: null,
    profile: null,

    async init() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            this.user = session.user;
            await this.loadProfile();
        }

        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                this.user = session.user;
                await this.loadProfile();
            } else {
                this.user = null;
                this.profile = null;
            }
            app.updateAuthUI();
        });
    },

    async loadProfile() {
        if (!this.user) return;
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', this.user.id)
            .single();

        if (error) {
            console.error('Error loading profile:', error);
            // If profile doesn't exist, we might need to create it (if trigger failed)
            if (error.code === 'PGRST116') {
                 await this.createProfile();
            }
        } else {
            this.profile = data;
        }
    },

    async createProfile() {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert([
                {
                    id: this.user.id,
                    full_name: this.user.user_metadata.full_name || 'Nuevo Usuario',
                    role: 'user' // default role
                }
            ])
            .select()
            .single();
        if (!error) this.profile = data;
    },

    async signUp(email, password, fullName) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.hash = '#home';
    },

    isAdmin() {
        return this.profile?.role === 'admin';
    },

    isOwner() {
        return this.profile?.role === 'owner' || this.profile?.role === 'admin';
    }
};
