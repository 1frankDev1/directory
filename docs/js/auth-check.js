let currentUser = null;
let currentProfile = null;

// Global promise to wait for auth to be ready
window.authReady = new Promise((resolve) => {
    window.resolveAuth = resolve;
});

async function checkSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (profile) {
                currentProfile = profile;
            } else {
                // Create profile if missing
                const { data: newProfile } = await supabaseClient
                    .from('profiles')
                    .insert([{
                        id: currentUser.id,
                        full_name: currentUser.user_metadata?.full_name || 'Usuario',
                        role: 'user'
                    }])
                    .select()
                    .single();
                currentProfile = newProfile;
            }
            updateUI();
        } else {
            handleNoSession();
        }
    } catch (err) {
        console.error('Auth Check Error:', err);
        handleNoSession();
    } finally {
        window.resolveAuth({ user: currentUser, profile: currentProfile });
    }
}

function handleNoSession() {
    const protectedPages = ['dashboard.html', 'admin.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
        window.location.href = 'login.html';
    }
}

function updateUI() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;

    if (currentUser) {
        let links = '';
        if (currentProfile?.role === 'admin') {
            links += '<a href="admin.html">Admin</a>';
        }
        if (currentProfile?.role === 'owner' || currentProfile?.role === 'admin') {
            links += '<a href="dashboard.html">Mi Panel</a>';
        } else {
             links += '<a href="dashboard.html">Registrar Negocio</a>';
        }
        links += `<a href="#" onclick="handleSignOut(event)">Salir</a>`;
        authLinks.innerHTML = links;
    }
}

async function handleSignOut(e) {
    if (e) e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

function redirectByRole(profile) {
    if (profile.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Listen for auth changes globally
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = 'index.html';
    }
});

checkSession();
