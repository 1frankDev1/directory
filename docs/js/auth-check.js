let currentUser = null;
let currentProfile = null;

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        currentProfile = profile;
        updateUI();
    } else {
        // If we are on a protected page, redirect
        const protectedPages = ['dashboard.html', 'admin.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
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
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

checkSession();
