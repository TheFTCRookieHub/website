// Main JS for The FTC Rookie Hub

document.addEventListener('DOMContentLoaded', () => {
    console.log('The FTC Rookie Hub initialized');

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.style.boxShadow = 'var(--shadow)';
            header.style.borderBottom = '1px solid var(--border)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Firebase Integration (Firestore only)
    const db = (typeof firebase !== 'undefined' && firebase.apps.length > 0) ? firebase.firestore() : null;

    // --- Forum Interaction ---
    const openPostModal = document.getElementById('openPostModal');
    const startDiscussionBtn = document.getElementById('startDiscussionBtn');
    const postModal = document.getElementById('postModal');
    const closeModal = document.getElementById('closeModal');
    const cancelPost = document.getElementById('cancelPost');
    const newPostForm = document.getElementById('newPostForm');
    const forumFeed = document.getElementById('forumFeed');

    const toggleModal = (show) => {
        if (postModal) postModal.style.display = show ? 'block' : 'none';
        if (show) {
            document.body.style.overflow = 'hidden';
            // Author pre-fill logic removed as auth is gone
        } else {
            document.body.style.overflow = 'auto';
        }
    };

    if (openPostModal) openPostModal.addEventListener('click', () => toggleModal(true));
    if (startDiscussionBtn) startDiscussionBtn.addEventListener('click', () => toggleModal(true));
    if (closeModal) closeModal.addEventListener('click', () => toggleModal(false));
    if (cancelPost) cancelPost.addEventListener('click', () => toggleModal(false));

    window.addEventListener('click', (e) => {
        if (e.target === postModal) toggleModal(false);
    });

    let currentCategory = new URLSearchParams(window.location.search).get('category') || 'All Topics';
    let forumListenerUnsubscribe = null;

    const renderEmptyState = () => {
        if (forumFeed) {
            forumFeed.innerHTML = `
                <div class="card" style="text-align: center; padding: 4rem 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem;">📣</div>
                    <h3 style="margin-bottom: 0.5rem;">No posts yet!</h3>
                    <p style="color: var(--text-muted);">Be the first to ask a question in this category.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('openPostModal').click()" style="margin-top: 2rem;">+ Start a Discussion</button>
                </div>
            `;
        }
    };

    const renderPost = (post) => {
        let date = 'Just now';
        if (post.createdAt) {
            const d = new Date(post.createdAt.seconds * 1000);
            date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }

        // Check if user can delete this post (exclusively session-based)
        const myPosts = JSON.parse(sessionStorage.getItem('myPosts') || '[]');
        const canDelete = myPosts.includes(post.id);

        const deleteButton = canDelete ? `
            <button onclick="deletePost('${post.id}')" 
                style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.2rem; padding: 0.25rem 0.5rem; transition: opacity 0.2s;"
                onmouseover="this.style.opacity='0.7'" 
                onmouseout="this.style.opacity='1'"
                title="Delete post">
                🗑️
            </button>
        ` : '';

        return `
            <div class="card animate-fade-in" style="margin-bottom: 1.5rem; padding: 2rem; border-left: 4px solid var(--primary); position: relative;">
                ${deleteButton ? `<div style="position: absolute; top: 1rem; right: 1rem;">${deleteButton}</div>` : ''}
                <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--primary);">
                        ${post.author ? post.author[0].toUpperCase() : 'R'}
                    </div>
                    <div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">
                            <a href="post.html?id=${post.id}" style="color: inherit; text-decoration: none;">${post.title}</a>
                        </h3>
                        <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: var(--text-muted);">
                            <span>By ${post.author || 'Rookie Team'}</span>
                            <span>•</span>
                            <span>${date}</span>
                            <span>•</span>
                            <span style="color: var(--primary); font-weight: 500;"># ${post.category}</span>
                        </div>
                    </div>
                </div>
                <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.content}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); pt: 1rem; margin-top: 1rem; padding-top: 1rem;">
                    <span style="font-size: 0.9rem; color: var(--text-muted);">0 replies</span>
                    <a href="post.html?id=${post.id}" style="color: var(--primary); font-weight: 600; font-size: 0.9rem; text-decoration: none;">Read More →</a>
                </div>
            </div>
        `;
    };

    // Delete post function (global scope for onclick handler)
    window.deletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await db.collection('posts').doc(postId).delete();
            const myPosts = JSON.parse(sessionStorage.getItem('myPosts') || '[]');
            const updatedPosts = myPosts.filter(id => id !== postId);
            sessionStorage.setItem('myPosts', JSON.stringify(updatedPosts));
            console.log('Post deleted successfully');
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post. Please try again.');
        }
    };

    const listenForPosts = () => {
        if (!db || !forumFeed) return;

        // Unsubscribe from previous listener if it exists
        if (forumListenerUnsubscribe) {
            forumListenerUnsubscribe();
        }

        // Fetch all posts ordered by date (simplest query, usually no index needed)
        // We filter client-side to avoid Index requirements for where+orderBy
        let query = db.collection('posts').orderBy('createdAt', 'desc');

        forumListenerUnsubscribe = query.onSnapshot((snapshot) => {
            if (snapshot.empty) {
                renderEmptyState();
                return;
            }

            let html = '';
            let hasPosts = false;

            snapshot.forEach((doc) => {
                const post = { id: doc.id, ...doc.data() };

                // Client-side filtering
                if (currentCategory === 'All Topics' || post.category === currentCategory) {
                    html += renderPost(post);
                    hasPosts = true;
                }
            });

            if (!hasPosts) {
                renderEmptyState();
            } else {
                forumFeed.innerHTML = html;
            }
        }, (error) => {
            console.error("Error fetching posts:", error);
            // Fallback for UI
            forumFeed.innerHTML = `<div class="card" style="padding: 2rem; color: red;">Error loading posts. Please check console.</div>`;
        });
    };

    // Anonymous Checkbox Logic
    const postAnonymous = document.getElementById('postAnonymous');
    const postAuthorInput = document.getElementById('postAuthor');

    if (postAnonymous && postAuthorInput) {
        postAnonymous.addEventListener('change', () => {
            if (postAnonymous.checked) {
                postAuthorInput.value = '';
                postAuthorInput.disabled = true;
                postAuthorInput.placeholder = 'Posting as Anonymous';
            } else {
                postAuthorInput.disabled = false;
                postAuthorInput.placeholder = 'e.g. Team 12345 or John Doe';
            }
        });
    }

    if (newPostForm) {
        newPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('postTitle').value;
            const category = document.getElementById('postCategory').value;
            const content = document.getElementById('postContent').value;
            const isAnonymous = document.getElementById('postAnonymous').checked;

            let author = "Anonymous";
            if (!isAnonymous) {
                author = document.getElementById('postAuthor').value.trim();
                if (!author) {
                    alert("Please enter your name/team name or select 'Post Anonymously'.");
                    return;
                }
            }

            try {
                const docRef = await db.collection('posts').add({
                    title,
                    category,
                    content,
                    author,
                    uid: null, // Always null as auth is removed
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Track this post in sessionStorage for deletion permission
                const myPosts = JSON.parse(sessionStorage.getItem('myPosts') || '[]');
                myPosts.push(docRef.id);
                sessionStorage.setItem('myPosts', JSON.stringify(myPosts));

                newPostForm.reset();
                toggleModal(false);
            } catch (err) {
                console.error("Error adding post:", err);
                alert("Failed to add post.");
            }
        });
    }

    // Forum Category Interaction
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        // Set initial active state based on URL param
        if (btn.textContent.trim() === currentCategory) {
            btn.classList.add('active');
            btn.style.background = '#eff6ff';
            btn.style.color = 'var(--primary)';
            btn.style.fontWeight = '600';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'white';
            btn.style.color = 'var(--text-muted)';
            btn.style.fontWeight = '500';
        }

        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'white';
                b.style.color = 'var(--text-muted)';
                b.style.fontWeight = '500';
            });
            btn.classList.add('active');
            btn.style.background = '#eff6ff';
            btn.style.color = 'var(--primary)';
            btn.style.fontWeight = '600';

            currentCategory = btn.textContent.trim();
            // Update URL without reloading
            const newUrl = new URL(window.location);
            if (currentCategory === 'All Topics') {
                newUrl.searchParams.delete('category');
            } else {
                newUrl.searchParams.set('category', currentCategory);
            }
            window.history.pushState({}, '', newUrl);

            listenForPosts();
        });
    });

    if (forumFeed && db) {
        listenForPosts();
    }

    // --- Homepage Recent Posts Sync ---
    const recentPostsFeed = document.getElementById('recentPostsFeed');
    if (recentPostsFeed && db) {
        db.collection('posts').orderBy('createdAt', 'desc').limit(3).onSnapshot((snapshot) => {
            if (snapshot.empty) return; // Keep default placeholder if empty

            let html = '<div style="display: grid; gap: 1.5rem; text-align: left;">';
            snapshot.forEach((doc) => {
                const post = { id: doc.id, ...doc.data() };
                // Reuse renderPost but maybe strip delete buttons or simplify if needed
                // For now, we'll just reuse the same card style but ensure ID uniqueness issues don't break things
                // Since renderPost returns a string, it's safe.
                html += renderPost(post);
            });
            html += '</div>';
            // Add a "View Forum" button at the bottom
            html += `
                <div style="margin-top: 2rem; text-align: center;">
                    <a href="forum.html" class="btn btn-primary">Go to Forum</a>
                </div>
            `;
            recentPostsFeed.innerHTML = html;
        });
    }

    // --- Connect Page Logic ---
    const connectForm = document.getElementById('connectForm');
    const connectFeed = document.getElementById('connectFeed');

    if (connectForm && db) {
        // Handle Submission
        connectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('connectorName').value;
            const role = document.getElementById('connectorRole').value;
            const location = document.getElementById('connectorLocation').value;
            const contact = document.getElementById('connectorContact').value;
            const bio = document.getElementById('connectorBio').value;

            try {
                await db.collection('team_requests').add({
                    name,
                    role,
                    location,
                    contact,
                    bio,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Profile posted successfully!');
                connectForm.reset();
            } catch (err) {
                console.error("Error posting profile:", err);
                alert("Failed to post profile. Try again.");
            }
        });

        // Handle Listening
        db.collection('team_requests').orderBy('createdAt', 'desc').limit(50).onSnapshot((snapshot) => {
            if (snapshot.empty) {
                connectFeed.innerHTML = `<div class="card" style="text-align: center; padding: 2rem;">No profiles found yet. Be the first!</div>`;
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';

                // Color code roles
                let roleColor = '#2563eb'; // Blue default
                if (data.role.includes('Builder')) roleColor = '#ea580c'; // Orange
                if (data.role.includes('Mentor')) roleColor = '#7c3aed'; // Purple
                if (data.role.includes('Recruiting')) roleColor = '#059669'; // Green

                html += `
                    <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid ${roleColor};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <h3 style="font-size: 1.25rem;">${data.name}</h3>
                            <span style="background: ${roleColor}20; color: ${roleColor}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${data.role}</span>
                        </div>
                        <div style="display: flex; gap: 1rem; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                            <span>📍 ${data.location}</span>
                            <span>📅 ${date}</span>
                        </div>
                        <p style="margin-bottom: 1rem; line-height: 1.5;">${data.bio}</p>
                        <div style="background: #f8fafc; padding: 0.75rem; border-radius: var(--radius); border: 1px solid var(--border); font-family: monospace; font-size: 0.9rem;">
                            📞 ${data.contact}
                        </div>
                    </div>
                `;
            });
            connectFeed.innerHTML = html;
        });
    }
});
