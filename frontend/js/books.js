// Load books data
async function loadBooks() {
    try {
        console.log('Loading books data...');
        const data = await graphqlQuery(API_URLS.book, `
            query {
                books {
                    id
                    title
                    author
                    year
                    jumlah
                }
            }
        `);

        // Update books table
        const tbody = document.querySelector('#booksTable tbody');
        if (!tbody) {
            console.error('Books table tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        if (data.books && data.books.length > 0) {
            data.books.forEach(book => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author || '-'}</td>
                    <td>${book.year || '-'}</td>
                    <td>${book.jumlah}</td>
                    <td>
                        <button onclick="viewBookDetails(${book.id})" class="btn btn-info btn-sm">Detail</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data buku</td></tr>';
        }

        // Update book select dropdowns
        const selectElements = ['selectBook', 'borrowBook', 'reviewBook', 'filterReviewBook'];
        selectElements.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Pilih buku...</option>';
                if (data.books && data.books.length > 0) {
                    data.books.forEach(book => {
                        const option = document.createElement('option');
                        option.value = book.id;
                        option.textContent = book.title;
                        select.appendChild(option);
                    });
                }
            }
        });

        console.log(`Loaded ${data.books?.length || 0} books successfully`);
    } catch (error) {
        console.error('Error loading books:', error);
        showAlert('Gagal memuat data buku: ' + error.message, 'error');
        
        // Show empty table on error
        const tbody = document.querySelector('#booksTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Gagal memuat data</td></tr>';
        }
    }
}

async function viewBookDetails(bookId) {
    try {
        console.log(`Loading details for book ID: ${bookId}`);
        const data = await graphqlQuery(API_URLS.book, `
            query {
                book(id: ${bookId}) {
                    id
                    title
                    author
                    year
                    jumlah
                }
            }
        `);

        if (!data.book) {
            showAlert('Data buku tidak ditemukan', 'error');
            return;
        }

        const book = data.book;
        
        // Get or create details container
        let detailsContainer = document.getElementById('bookDetailsContainer');
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.id = 'bookDetailsContainer';
            detailsContainer.className = 'mt-4';
            
            // Insert after the table
            const table = document.getElementById('booksTable');
            if (table && table.parentNode) {
                table.parentNode.insertBefore(detailsContainer, table.nextSibling);
            }
        }
        
        // Update details content
        detailsContainer.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Detail Buku</h5>
                    <button type="button" class="btn-close" onclick="hideBookDetails()"></button>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>ID:</strong> ${book.id}</p>
                            <p><strong>Judul:</strong> ${book.title}</p>
                            <p><strong>Penulis:</strong> ${book.author || '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Tahun:</strong> ${book.year || '-'}</p>
                            <p><strong>Stok:</strong> ${book.jumlah}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Show the details container
        detailsContainer.style.display = 'block';
        
        console.log('Book details loaded successfully');
    } catch (error) {
        console.error('Error loading book details:', error);
        showAlert('Gagal memuat detail buku: ' + error.message, 'error');
    }
}

// Function to hide book details
function hideBookDetails() {
    const detailsContainer = document.getElementById('bookDetailsContainer');
    if (detailsContainer) {
        detailsContainer.style.display = 'none';
    }
}

// Add new book - Fixed with proper escaping
async function addBook(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const year = document.getElementById('bookYear').value;
    const jumlah = parseInt(document.getElementById('bookStock').value);

    // Basic validation
    if (!title) {
        showAlert('Judul buku harus diisi!', 'error');
        return;
    }

    if (jumlah < 1) {
        showAlert('Jumlah stok minimal 1!', 'error');
        return;
    }

    try {
        console.log('Adding new book:', { title, author, year, jumlah });
        
        // Escape quotes to prevent GraphQL syntax errors
        const escapedTitle = title.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
        const escapedAuthor = author.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
        
        // Build mutation with proper parameter handling
        let mutationArgs = [`title: "${escapedTitle}"`];
        
        if (author) {
            mutationArgs.push(`author: "${escapedAuthor}"`);
        }
        
        if (year) {
            mutationArgs.push(`year: ${parseInt(year)}`);
        }
        
        mutationArgs.push(`jumlah: ${jumlah}`);

        const mutation = `
            mutation {
                createBook(${mutationArgs.join(', ')}) {
                    id
                    title
                    author
                    year
                    jumlah
                }
            }
        `;

        console.log('GraphQL Mutation:', mutation);
        const data = await graphqlQuery(API_URLS.book, mutation);

        if (data.createBook) {
            showAlert('Buku berhasil ditambahkan!', 'success');
            e.target.reset();
            await loadBooks(); // Reload books list
            console.log('Book added successfully:', data.createBook);
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showAlert('Gagal menambahkan buku: ' + error.message, 'error');
    }
}

// Update book stock - Fixed with proper parameter handling
async function updateBookStock(e) {
    e.preventDefault();
    
    const bookId = document.getElementById('selectBook').value;
    const jumlah = parseInt(document.getElementById('newStock').value);

    if (!bookId) {
        showAlert('Pilih buku terlebih dahulu!', 'error');
        return;
    }

    if (isNaN(jumlah) || jumlah < 0) {
        showAlert('Jumlah stok harus berupa angka dan tidak boleh negatif!', 'error');
        return;
    }

    try {
        console.log('Updating book stock:', { bookId, jumlah });
        
        // Use variables for better GraphQL handling
        const data = await graphqlQuery(API_URLS.book, `
            mutation UpdateStok($bookId: ID!, $jumlah: Int!) {
                updateStok(bookId: $bookId, jumlah: $jumlah) {
                    id
                    title
                    jumlah
                }
            }
        `, { 
            bookId: parseInt(bookId), 
            jumlah: jumlah 
        });

        if (data.updateStok) {
            showAlert('Stok buku berhasil diperbarui!', 'success');
            e.target.reset();
            await loadBooks(); // Reload books list
            console.log('Book stock updated successfully:', data.updateStok);
        }
    } catch (error) {
        console.error('Error updating book stock:', error);
        showAlert('Gagal memperbarui stok buku: ' + error.message, 'error');
    }
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing books.js event listeners...');
    
    // Add book form
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', addBook);
        console.log('Add book form listener attached');
    } else {
        console.error('Add book form not found');
    }

    // Update stock form
    const updateStockForm = document.getElementById('updateStockForm');
    if (updateStockForm) {
        updateStockForm.addEventListener('submit', updateBookStock);
        console.log('Update stock form listener attached');
    } else {
        console.error('Update stock form not found');
    }

    // Set today's date as default for year field
    const currentYear = new Date().getFullYear();
    const bookYearField = document.getElementById('bookYear');
    if (bookYearField) {
        bookYearField.max = currentYear;
        bookYearField.placeholder = `Contoh: ${currentYear}`;
    }

    console.log('Books.js initialization complete');
});

// Additional utility function to validate book data
function validateBookData(title, author, year, jumlah) {
    const errors = [];
    
    if (!title || title.trim().length === 0) {
        errors.push('Judul buku tidak boleh kosong');
    }
    
    if (title && title.length > 255) {
        errors.push('Judul buku terlalu panjang (maksimal 255 karakter)');
    }
    
    if (author && author.length > 255) {
        errors.push('Nama penulis terlalu panjang (maksimal 255 karakter)');
    }
    
    if (year && (year < 1000 || year > new Date().getFullYear())) {
        errors.push(`Tahun harus antara 1000 dan ${new Date().getFullYear()}`);
    }
    
    if (!jumlah || jumlah < 1 || jumlah > 9999) {
        errors.push('Jumlah stok harus antara 1 dan 9999');
    }
    
    return errors;
}