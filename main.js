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

    // Updated Header scroll effect for Light Theme
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.style.boxShadow = 'var(--shadow)';
            header.style.borderBottom = '1px solid var(--border)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Auth Toggling (Login vs Sign Up)
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const authBtn = document.getElementById('authBtn');
    const teamGroup = document.getElementById('teamGroup');
    const confirmGroup = document.getElementById('confirmGroup');

    if (loginTab && signupTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            teamGroup.style.display = 'none';
            confirmGroup.style.display = 'none';
            authBtn.textContent = 'Continue to the Hub';
        });

        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            teamGroup.style.display = 'block';
            confirmGroup.style.display = 'block';
            authBtn.textContent = 'Create My Account';
        });
    }


    // Firebase Integration
    const db = (typeof firebase !== 'undefined' && firebase.apps.length > 0) ? firebase.firestore() : null;
    const auth = (typeof firebase !== 'undefined' && firebase.apps.length > 0) ? firebase.auth() : null;

    // --- Global Auth Listener ---
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            const authBtns = document.querySelector('.auth-btns');
            const navLinks = document.querySelector('.nav-links');

            if (user) {
                console.log("User logged in:", user.email);
                // Fetch additional user data (like Team Name) from Firestore
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.exists ? userDoc.data() : null;
                const teamName = userData ? userData.teamName : "Rookie Hub User";

                // Update Header UI
                if (authBtns) {
                    authBtns.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 0.9rem; font-weight: 500;">Hi, ${teamName}</span>
                            <button id="logoutBtn" class="btn btn-outline" style="padding: 0.5rem 1rem;">Log Out</button>
                        </div>
                    `;
                    document.getElementById('logoutBtn').addEventListener('click', () => {
                        auth.signOut().then(() => {
                            window.location.href = 'index.html';
                        });
                    });
                }
            } else {
                console.log("No user logged in");
                if (authBtns) {
                    authBtns.innerHTML = `
                        <a href="auth.html" class="btn btn-outline">Log In</a>
                        <a href="auth.html" class="btn btn-primary">Sign Up</a>
                    `;
                }
            }
        });
    }

    // --- Auth Form Logic (auth.html) ---
    const authForm = document.getElementById('authForm');
    if (authForm && auth) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const isSignUp = signupTab.classList.contains('active');

            try {
                if (isSignUp) {
                    const teamName = document.getElementById('team').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;

                    if (password !== confirmPassword) {
                        alert("Passwords do not match!");
                        return;
                    }

                    // 1. Create User
                    const cred = await auth.createUserWithEmailAndPassword(email, password);

                    // 2. Save Team Name to Firestore
                    await db.collection('users').doc(cred.user.uid).set({
                        teamName: teamName,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    alert("Account created successfully!");
                } else {
                    // Log In
                    await auth.signInWithEmailAndPassword(email, password);
                }

                // Redirect on success
                window.location.href = 'index.html';

            } catch (err) {
                console.error("Auth Error:", err);
                alert(err.message);
            }
        });
    }

    // --- Forum Interaction ---
    const openPostModal = document.getElementById('openPostModal');
    const startDiscussionBtn = document.getElementById('startDiscussionBtn');
    const postModal = document.getElementById('postModal');
    const closeModal = document.getElementById('closeModal');
    const cancelPost = document.getElementById('cancelPost');
    const newPostForm = document.getElementById('newPostForm');
    const forumFeed = document.getElementById('forumFeed');

    const toggleModal = (show) => {
        // Removed auth check to allow anonymous posting
        if (postModal) postModal.style.display = show ? 'block' : 'none';
        if (show) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';

        // Pre-fill name if logged in
        if (show && auth?.currentUser) {
            const nameInput = document.getElementById('postAuthor');
            if (nameInput && !nameInput.value) {
                // We'll try to fetch it if we don't have it locally, but for now just leave it open or user can type
                // Optimistically we could check our local user data if we stored it globally, but for now let's just let them type
                // or if we really wanted, we could do a quick lookup here, but might be overkill.
                // Let's just focus on the anonymous toggle logic below.
            }
        }
    };

    if (openPostModal) openPostModal.addEventListener('click', () => toggleModal(true));
    if (startDiscussionBtn) startDiscussionBtn.addEventListener('click', () => toggleModal(true));
    if (closeModal) closeModal.addEventListener('click', () => toggleModal(false));
    if (cancelPost) cancelPost.addEventListener('click', () => toggleModal(false));

    window.addEventListener('click', (e) => {
        if (e.target === postModal) toggleModal(false);
    });

    let currentCategory = 'All Topics';

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
        const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
        return `
            <div class="card animate-fade-in" style="margin-bottom: 1.5rem; padding: 2rem; border-left: 4px solid var(--primary);">
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

    const listenForPosts = () => {
        if (!db || !forumFeed) return;

        let query = db.collection('posts').orderBy('createdAt', 'desc');
        if (currentCategory !== 'All Topics') {
            query = query.where('category', '==', currentCategory);
        }

        query.onSnapshot((snapshot) => {
            if (snapshot.empty) {
                renderEmptyState();
                return;
            }

            let html = '';
            snapshot.forEach((doc) => {
                const post = { id: doc.id, ...doc.data() };
                html += renderPost(post);
            });
            forumFeed.innerHTML = html;
        }, (error) => {
            console.error("Error fetching posts:", error);
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

            // Removed login check
            // if (!db || !auth.currentUser) ...

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
                // Use current user UID if available, otherwise null
                const uid = auth.currentUser ? auth.currentUser.uid : null;

                await db.collection('posts').add({
                    title,
                    category,
                    content,
                    author,
                    uid: uid, // Can be null now
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

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
            listenForPosts();
        });
    });

    // Initial load for forum
    if (forumFeed && db) {
        listenForPosts();
    }
});

// Helper function to render common components if needed via JS
function loadComponent(id, html) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = html;
    }
}
