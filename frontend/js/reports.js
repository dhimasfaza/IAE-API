// Reports Functions
function displayReports() {
    displayTopBooks();
    displaySystemSummary();
}

async function displayTopBooks() {
    try {
        const data = await graphqlQuery(API_URLS.borrowing, `
            query {
                topBorrowedBooks {
                    book_id
                    total_peminjaman
                }
            }
        `);

        const tbody = document.querySelector('#topBooksTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        data.topBorrowedBooks.forEach((book, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${book.book_id}</td>
                <td>${book.total_peminjaman}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading top books:', error);
        showAlert('Gagal memuat data buku terpopuler', 'error');
    }
}

async function displaySystemSummary() {
    try {
        // Load all necessary data
        const [membersData, booksData, borrowingsData, reviewsData] = await Promise.all([
            graphqlQuery(API_URLS.user, `
                query {
                    members {
                        id
                    }
                }
            `),
            graphqlQuery(API_URLS.book, `
                query {
                    books {
                        id
                        jumlah
                    }
                }
            `),
            graphqlQuery(API_URLS.borrowing, `
                query {
                    borrowings {
                        id
                        status
                        denda
                    }
                }
            `),
            graphqlQuery(API_URLS.review, `
                query {
                    reviews {
                        id
                        rating
                    }
                }
            `)
        ]);

        // Calculate summary statistics
        const totalMembers = membersData.members.length;
        const totalBooks = booksData.books.length;
        const totalStock = booksData.books.reduce((sum, book) => sum + book.jumlah, 0);
        const activeBorrowings = borrowingsData.borrowings.filter(b => b.status === 'dipinjam').length;
        const totalDenda = borrowingsData.borrowings.reduce((sum, b) => sum + (b.denda || 0), 0);
        const totalReviews = reviewsData.reviews.length;
        const avgRating = totalReviews > 0 
            ? (reviewsData.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : 0;

        // Update system summary
        const summaryDiv = document.getElementById('systemSummary');
        summaryDiv.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <h4>Total Anggota</h4>
                    <p>${totalMembers}</p>
                </div>
                <div class="summary-item">
                    <h4>Total Buku</h4>
                    <p>${totalBooks} (${totalStock} stok)</p>
                </div>
                <div class="summary-item">
                    <h4>Peminjaman Aktif</h4>
                    <p>${activeBorrowings}</p>
                </div>
                <div class="summary-item">
                    <h4>Total Denda</h4>
                    <p>Rp ${totalDenda.toLocaleString()}</p>
                </div>
                <div class="summary-item">
                    <h4>Total Review</h4>
                    <p>${totalReviews}</p>
                </div>
                <div class="summary-item">
                    <h4>Rata-rata Rating</h4>
                    <p>${avgRating} ⭐</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading system summary:', error);
        showAlert('Gagal memuat ringkasan sistem', 'error');
    }
} 