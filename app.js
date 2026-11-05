    const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
    const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

    // Referencias al DOM principales
    const postsContainer = document.getElementById('posts-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const searchInput = document.getElementById('search-input');

    // Referencias al DOM del Modal y Formulario
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const postModal = document.getElementById('post-modal');
    const newPostForm = document.getElementById('new-post-form');
    const newTitleInput = document.getElementById('new-title');
    const newBodyInput = document.getElementById('new-body');

    const userModal = document.getElementById('user-modal');
    const closeUserModalBtn = document.getElementById('close-user-modal-btn');
    const userProfileContainer = document.getElementById('user-profile-container');

    let allPosts = [];

    /**
     * Inicializar aplicación cargando datos GET
     */
    async function initApp() {
        showLoading(true);
        showError(false); // Corregido: Oculta el error al iniciar correctamente

        try {
            // Realizamos peticiones en paralelo usando Promise.all
            const [postsResponse, usersResponse] = await Promise.all([
                fetch(POSTS_URL),
                fetch(USERS_URL)
            ]);

            if (!postsResponse.ok || !usersResponse.ok) {
                throw new Error('Error al conectar con el servidor.');
            }

            const posts = await postsResponse.json();
            const users = await usersResponse.json();

            // Mapeamos los posts para adjuntar el nombre del autor
            allPosts = posts.map(post => {
                const author = users.find(user => user.id === post.userId);
                return {
                    ...post,
                    authorName: author ? author.name : 'Usuario Desconocido'
                };
            });

            // Renderizamos las tarjetas en el DOM
            renderPosts(allPosts);

        } catch (error) {
            console.error('Hubo un problema:', error);
            showError(true);
        } finally {
            showLoading(false);
        }
    }

    function profileView(user) {
    if (user === null) {
        return `<p class="no-results" style="text-align: center; color: var(--text-muted);">No se encontró información del usuario.</p>`;
    }

    return `
        <article class="post-card" style="margin: 0; width: 100%; box-shadow: none; border: none;">
            <div>
                <h2 class="post-title">@${user.username}</h2>
                <div class="user-details" style="margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <p class="post-body"><strong> Email:</strong> ${user.email}</p>
                    <p class="post-body"><strong> Teléfono:</strong> ${user.phone}</p>
                    <p class="post-body"><strong> Sitio web:</strong> <a href="https://${user.website}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: none;">${user.website}</a></p>
                </div>
            </div>
            <span class="post-author"> Usuario Verificado</span>
        </article>
    `;
    }

    /**
     * Renderizar tarjetas en el DOM
     */
    function renderPosts(postsToRender) {
        if (postsToRender.length === 0) {
            postsContainer.innerHTML = `<p class="no-results" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron publicaciones.</p>`;
            return;
        }

        const postsHTML = postsToRender.map(post => `
            <article class="post-card">
                <div>
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-body">${post.body}</p>
                </div>
                <button class="post-author btn-open-user" data-userid="${post.userId}" style="background: none; border: none; cursor: pointer; text-align: left; padding: 0; font: inherit;">
                <span class="post-author">✍️ ${post.authorName}</span>
                </button>
            </article>
        `).join('');

        postsContainer.innerHTML = postsHTML;
    }

    if (postsContainer) {
        postsContainer.addEventListener('click', async (e) => {
            const authorBtn = e.target.closest('.btn-open-user');
            if (!authorBtn) return;

            const userId = authorBtn.dataset.userid;
            
            // Muestra el modal y un mensaje de carga previo
            userModal.classList.remove('hidden');
            userProfileContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Cargando perfil...</p>`;

            try {
                const response = await fetch(`${USERS_URL}/${userId}`);
                if (!response.ok) throw new Error('No se pudo obtener la información del usuario');

                const user = await response.json();
                userProfileContainer.innerHTML = profileView(user);
            } catch (error) {
                console.error(error);
                userProfileContainer.innerHTML = profileView(null);
            }
        });
    }

    /**
     * Manejo del Modal (Abrir y Cerrar)
     */
    openModalBtn.addEventListener('click', () => {
        postModal.classList.remove('hidden');
        newTitleInput.focus();
    });

    closeModalBtn.addEventListener('click', () => {
        postModal.classList.add('hidden');
    });

    closeUserModalBtn.addEventListener('click', () => {
        userModal.classList.add('hidden');
    });

    // Cerrar si se hace clic fuera del contenido del modal
    window.addEventListener('click', (e) => {
        if (e.target === postModal) {
            postModal.classList.add('hidden');
        }
    });

    /**
     * Enviar Nueva Publicación mediante Petición POST
     */
    newPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = newTitleInput.value.trim();
        const body = newBodyInput.value.trim();

        if (!title || !body) return;

        const newPostPayload = {
            title: title,
            body: body,
            userId: 1 // Simulamos que el usuario actual tiene ID 1
        };

        try {
            const response = await fetch(POSTS_URL, {
                method: 'POST',
                body: JSON.stringify(newPostPayload),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });

            if (!response.ok) {
                throw new Error('Error al registrar la publicación en el servidor.');
            }

            const createdPost = await response.json();
            createdPost.authorName = 'Tú (Autor Actual)';

            // Insertamos el nuevo post al inicio del arreglo global
            allPosts.unshift(createdPost);

            // Volvemos a renderizar la interfaz
            renderPosts(allPosts);

            // Limpiamos formulario y cerramos modal
            newPostForm.reset();
            postModal.classList.add('hidden');

            alert('¡Publicación creada exitosamente!');

        } catch (error) {
            console.error('Error al enviar POST:', error);
            alert('No se pudo crear la publicación. Inténtalo de nuevo.');
        }
    });

    /**
     * Buscador en tiempo real
     */
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        const filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            post.body.toLowerCase().includes(searchTerm)
        );

        renderPosts(filteredPosts);
    });

    // Funciones auxiliares de UI (Control de estados)
    function showLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.classList.remove('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
        }
    }

    function showError(hasError) {
        if (hasError) {
            errorMessage.classList.remove('hidden');
        } else {
            errorMessage.classList.add('hidden');
        }
    }
    // Inicializar al cargar el DOM
    document.addEventListener('DOMContentLoaded', initApp);