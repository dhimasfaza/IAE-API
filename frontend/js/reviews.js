// Load reviews data
async function loadReviews() {
    try {
        const data = await graphqlQuery(API_URLS.review, `
            query {
                reviews {
                    id
                    member_id
                    book_id
                    rating
                    comment
                }
            }
        `);

        // Update reviews table
        const tbody = document.querySelector('#reviewsTable tbody');
        tbody.innerHTML = '';
        data.reviews.forEach(review => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${review.id}</td>
                <td>${review.member_id}</td>
                <td>${review.book_id}</td>
                <td>${'⭐'.repeat(review.rating)}</td>
                <td>${review.comment || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
        showAlert('Gagal memuat data ulasan', 'error');
    }
}

// Add new review
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberId = document.getElementById('reviewMember').value;
    const bookId = document.getElementById('reviewBook').value;
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;

    if (!memberId || !bookId || !rating) {
        showAlert('Member, buku, dan rating harus diisi!', 'error');
        return;
    }

    try {
        await graphqlQuery(API_URLS.review, `
            mutation {
                addReview(
                    memberId: ${parseInt(memberId)},
                    bookId: ${parseInt(bookId)},
                    rating: ${rating},
                    comment: "${comment.replace(/"/g, '\\"')}"
                ) {
                    id
                    member_id
                    book_id
                    rating
                    comment
                }
            }
        `);

        showAlert('Ulasan berhasil ditambahkan!', 'success');
        e.target.reset();
        loadReviews();
    } catch (error) {
        console.error('Error adding review:', error);
        showAlert('Gagal menambahkan ulasan: ' + (error.message || 'Unknown error'), 'error');
    }
});

// Rating stars functionality
document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        document.getElementById('reviewRating').value = rating;
        
        // Update stars display
        document.querySelectorAll('.star').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
        });
    });
});

// Filter reviews by book
document.getElementById('filterReviewBook').addEventListener('change', (e) => {
    const bookId = e.target.value;
    loadReviews(bookId || null);
}); 