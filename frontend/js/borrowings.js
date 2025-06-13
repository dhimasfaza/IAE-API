// Load borrowings data with enhanced error handling and member/book name resolution
async function loadBorrowings() {
    try {
        console.log('Loading borrowings data...');
        
        // Load borrowings data from backend
        const data = await graphqlQuery(API_URLS.borrowing, `
            query {
                borrowings {
                    id
                    member_id
                    book_id
                    tanggal_peminjaman
                    tanggal_jatuh_tempo
                    tanggal_pengembalian
                    status
                    denda
                }
            }
        `);

        console.log('Borrowings data loaded:', data);

        // Load members and books data for display names
        let membersData = [];
        let booksData = [];
        
        try {
            const membersResult = await graphqlQuery(API_URLS.user, `
                query {
                    members {
                        id
                        name
                    }
                }
            `);
            membersData = membersResult.members || [];
        } catch (error) {
            console.warn('Failed to load members for borrowings display:', error.message);
        }

        try {
            const booksResult = await graphqlQuery(API_URLS.book, `
                query {
                    books {
                        id
                        title
                    }
                }
            `);
            booksData = booksResult.books || [];
        } catch (error) {
            console.warn('Failed to load books for borrowings display:', error.message);
        }

        // Create lookup maps
        const memberMap = {};
        const bookMap = {};
        
        membersData.forEach(member => {
            memberMap[member.id] = member.name;
        });
        
        booksData.forEach(book => {
            bookMap[book.id] = book.title;
        });

        // Update borrowings table
        const tbody = document.querySelector('#borrowingsTable tbody');
        if (!tbody) {
            console.error('Borrowings table tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (data.borrowings && data.borrowings.length > 0) {
            data.borrowings.forEach(borrowing => {
                const memberName = memberMap[borrowing.member_id] || `ID: ${borrowing.member_id}`;
                const bookTitle = bookMap[borrowing.book_id] || `ID: ${borrowing.book_id}`;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${borrowing.id}</td>
                    <td title="ID: ${borrowing.member_id}">${memberName}</td>
                    <td title="ID: ${borrowing.book_id}">${bookTitle}</td>
                    <td>${borrowing.tanggal_peminjaman}</td>
                    <td>${borrowing.tanggal_jatuh_tempo}</td>
                    <td>
                        <span class="badge ${((borrowing.status || '').toLowerCase() === 'dipinjam') ? 'bg-warning' : 'bg-success'}">
                            ${borrowing.status || '-'}
                        </span>
                    </td>
                    <td>Rp ${(borrowing.denda || 0).toLocaleString('id-ID')}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data peminjaman</td></tr>';
        }

        // Update active borrowings select for return form
        const activeBorrowingsSelect = document.getElementById('activeBorrowings');
        if (activeBorrowingsSelect) {
            activeBorrowingsSelect.innerHTML = '<option value="">Pilih peminjaman...</option>';
            
            if (data.borrowings) {
                // Debug log
                console.log('Borrowings for dropdown:', data.borrowings.map(b => ({id: b.id, status: b.status, tanggal_pengembalian: b.tanggal_pengembalian})));
                const activeBorrowings = data.borrowings.filter(b => (b.status || '').toLowerCase() === 'dipinjam' && (!b.tanggal_pengembalian || b.tanggal_pengembalian === ''));
                activeBorrowings.forEach(borrowing => {
                    const memberName = memberMap[borrowing.member_id] || `ID: ${borrowing.member_id}`;
                    const bookTitle = bookMap[borrowing.book_id] || `ID: ${borrowing.book_id}`;
                    
                    const option = document.createElement('option');
                    option.value = borrowing.id;
                    option.textContent = `${memberName} - ${bookTitle} (${borrowing.tanggal_peminjaman})`;
                    activeBorrowingsSelect.appendChild(option);
                });
            }
        }

        console.log(`Loaded ${data.borrowings?.length || 0} borrowings successfully`);
    } catch (error) {
        console.error('Error loading borrowings:', error);
        showAlert('Gagal memuat data peminjaman: ' + error.message, 'error');
        
        // Show empty table on error
        const tbody = document.querySelector('#borrowingsTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data</td></tr>';
        }
    }
}

// Load top borrowed books data
async function loadTopBorrowedBooks() {
    try {
        console.log('Loading top borrowed books...');
        
        const data = await graphqlQuery(API_URLS.borrowing, `
            query {
                topBorrowedBooks {
                    book_id
                    total_peminjaman
                }
            }
        `);

        console.log('Top borrowed books data:', data);

        // Load book titles for display
        let booksData = [];
        try {
            const booksResult = await graphqlQuery(API_URLS.book, `
                query {
                    books {
                        id
                        title
                    }
                }
            `);
            booksData = booksResult.books || [];
        } catch (error) {
            console.warn('Failed to load books for top borrowed display:', error.message);
        }

        const bookMap = {};
        booksData.forEach(book => {
            bookMap[book.id] = book.title;
        });

        // Update top books display (if container exists)
        const topBooksContainer = document.getElementById('topBorrowedBooksContainer');
        if (topBooksContainer && data.topBorrowedBooks) {
            topBooksContainer.innerHTML = `
                <h4>📊 Top 5 Buku Paling Dipinjam</h4>
                <div class="list-group">
                    ${data.topBorrowedBooks.map((item, index) => {
                        const bookTitle = bookMap[item.book_id] || `ID: ${item.book_id}`;
                        return `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>#${index + 1}</strong> ${bookTitle}
                                </div>
                                <span class="badge bg-primary rounded-pill">${item.total_peminjaman} kali</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return data.topBorrowedBooks;
    } catch (error) {
        console.error('Error loading top borrowed books:', error);
        showAlert('Gagal memuat data buku terpopuler: ' + error.message, 'error');
        return [];
    }
}

// Borrow a book with proper validation and error handling
async function borrowBook(e) {
    e.preventDefault();
    
    const memberId = parseInt(document.getElementById('borrowMember').value);
    const bookId = parseInt(document.getElementById('borrowBook').value);
    const tanggal_peminjaman = document.getElementById('borrowDate').value;

    // Validation
    if (!memberId || !bookId || !tanggal_peminjaman) {
        showAlert('Semua field harus diisi!', 'error');
        return;
    }

    // Validate date (tidak boleh masa lalu)
    const borrowDate = new Date(tanggal_peminjaman);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (borrowDate < today) {
        showAlert('Tanggal peminjaman tidak boleh di masa lalu!', 'error');
        return;
    }

    try {
        console.log('Borrowing book:', { memberId, bookId, tanggal_peminjaman });
        
        const data = await graphqlQuery(API_URLS.borrowing, `
            mutation {
                borrowBook(memberId: ${memberId}, bookId: ${bookId}, tanggal_peminjaman: "${tanggal_peminjaman}") {
                    id
                    member_id
                    book_id
                    tanggal_peminjaman
                    tanggal_jatuh_tempo
                    status
                    denda
                }
            }
        `);

        if (data.borrowBook) {
            showAlert('Buku berhasil dipinjam!', 'success');
            e.target.reset();
            
            // Set default date to today
            document.getElementById('borrowDate').value = new Date().toISOString().split('T')[0];
            
            // Reload borrowings and update book stock display
            await loadBorrowings();
            
            // Reload books if function exists to update stock display
            if (typeof loadBooks === 'function') {
                await loadBooks();
            }
            
            console.log('Book borrowed successfully:', data.borrowBook);
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        showAlert('Gagal meminjam buku: ' + error.message, 'error');
    }
}

// Return a book with proper validation and error handling
async function returnBook(e) {
    e.preventDefault();
    
    const loanId = parseInt(document.getElementById('activeBorrowings').value);

    if (!loanId) {
        showAlert('Pilih peminjaman terlebih dahulu!', 'error');
        return;
    }

    try {
        console.log('Returning book, loan ID:', loanId);
        
        const data = await graphqlQuery(API_URLS.borrowing, `
            mutation {
                returnBook(loanId: ${loanId}) {
                    id
                    member_id
                    book_id
                    tanggal_peminjaman
                    tanggal_jatuh_tempo
                    tanggal_pengembalian
                    status
                    denda
                }
            }
        `);

        if (data.returnBook) {
            const returnedLoan = data.returnBook;
            let message = 'Buku berhasil dikembalikan!';
            
            if (returnedLoan.denda && returnedLoan.denda > 0) {
                message += ` Denda keterlambatan: Rp ${returnedLoan.denda.toLocaleString('id-ID')}`;
                showAlert(message, 'warning');
            } else {
                showAlert(message, 'success');
            }
            
            e.target.reset();
            
            // Reload borrowings and update book stock display
            await loadBorrowings();
            
            // Reload books if function exists to update stock display
            if (typeof loadBooks === 'function') {
                await loadBooks();
            }
            
            console.log('Book returned successfully:', returnedLoan);
        }
    } catch (error) {
        console.error('Error returning book:', error);
        showAlert('Gagal mengembalikan buku: ' + error.message, 'error');
    }
}

// Initialize borrowings section
function initializeBorrowings() {
    console.log('Initializing borrowings section...');
    
    // Set default date to today
    const borrowDateInput = document.getElementById('borrowDate');
    if (borrowDateInput) {
        borrowDateInput.value = new Date().toISOString().split('T')[0];
        // Set min date to today
        borrowDateInput.min = new Date().toISOString().split('T')[0];
    }

    // Load initial data
    loadBorrowings();
    loadTopBorrowedBooks();
    
    console.log('Borrowings section initialized');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing borrowings.js event listeners...');
    
    // Borrow book form
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', borrowBook);
        console.log('Borrow form listener attached');
    } else {
        console.error('Borrow form not found');
    }

    // Return book form
    const returnForm = document.getElementById('returnForm');
    if (returnForm) {
        returnForm.addEventListener('submit', returnBook);
        console.log('Return form listener attached');
    } else {
        console.error('Return form not found');
    }

    console.log('Borrowings.js event listeners initialization complete');
});

// Export functions for use by other modules
if (typeof window !== 'undefined') {
    window.loadBorrowings = loadBorrowings;
    window.loadTopBorrowedBooks = loadTopBorrowedBooks;
    window.initializeBorrowings = initializeBorrowings;
}