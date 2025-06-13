// Configuration
const API_BASE_URL = 'http://localhost';
const SERVICES = {
    users: `${API_BASE_URL}:5000/graphql`,
    books: `${API_BASE_URL}:5001/graphql`,
    borrowings: `${API_BASE_URL}:5002/graphql`,
    reviews: `${API_BASE_URL}:5003/graphql`
};

// Global variables
let currentRating = 0;
let allMembers = [];
let allBooks = [];
let allBorrowings = [];
let allReviews = [];

// GraphQL client setup
const API_URLS = {
    user: 'http://localhost:5000/graphql',
    book: 'http://localhost:5001/graphql',
    borrowing: 'http://localhost:5002/graphql',
    review: 'http://localhost:5003/graphql'
};

// Enhanced GraphQL query function with better error handling
async function graphqlQuery(url, query, variables = {}) {
    try {
        console.log('GraphQL Request:', { url, query, variables });
        
        // Prepare request body
        const requestBody = {
            query: query.trim()
        };
        
        // Add variables only if they exist and are not empty
        if (variables && Object.keys(variables).length > 0) {
            requestBody.variables = variables;
        }
        
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status, response.statusText);

        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('GraphQL Response:', result);

        // Check for GraphQL errors
        if (result.errors && result.errors.length > 0) {
            const errorMessage = result.errors.map(err => err.message).join(', ');
            console.error('GraphQL Errors:', result.errors);
            throw new Error(`GraphQL Error: ${errorMessage}`);
        }

        // Check if data exists
        if (!result.data) {
            console.error('No data in GraphQL response:', result);
            throw new Error('No data returned from GraphQL query');
        }

        return result.data;
    } catch (error) {
        console.error('GraphQL Error Details:', {
            url,
            query,
            variables,
            error: error.message,
            stack: error.stack
        });
        
        // Enhanced error messages for common issues
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Backend service tidak dapat diakses. Pastikan server backend berjalan di ' + url);
        } else if (error.message.includes('HTTP 404')) {
            throw new Error('GraphQL endpoint tidak ditemukan. Periksa URL backend: ' + url);
        } else if (error.message.includes('HTTP 500')) {
            throw new Error('Internal server error. Periksa log backend untuk detail lebih lanjut.');
        } else if (error.message.includes('NetworkError')) {
            throw new Error('Koneksi jaringan bermasalah. Periksa koneksi internet dan backend server.');
        }
        
        throw error;
    }
}

// Enhanced alert system with auto-dismiss and types
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('Alert container not found');
        return;
    }

    const alertId = 'alert-' + Date.now();
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="me-2">
                ${getAlertIcon(type)}
            </div>
            <div class="flex-grow-1">
                ${message}
            </div>
            <button type="button" class="btn-close" onclick="removeAlert('${alertId}')"></button>
        </div>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        removeAlert(alertId);
    }, 5000);
}

// Get alert icon based on type
function getAlertIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return 'ℹ️';
    }
}

// Remove alert function
function removeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert && alert.parentElement) {
        alert.remove();
    }
}

// Enhanced navigation with proper error handling
function showSection(sectionId) {
    try {
        console.log('Switching to section:', sectionId);
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            console.error(`Section ${sectionId} not found`);
            showAlert(`Bagian ${sectionId} tidak ditemukan`, 'error');
            return;
        }
        targetSection.classList.add('active');
        
        // Update navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`.nav-tab[onclick="showSection('${sectionId}')"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Load section data
        loadSectionData(sectionId);
        
        console.log('Successfully switched to section:', sectionId);
    } catch (error) {
        console.error('Error switching sections:', error);
        showAlert('Error switching sections: ' + error.message, 'error');
    }
}

// Load dashboard stats with enhanced borrowings statistics
async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        
        // Initialize stats
        const stats = {
            totalBooks: 0,
            totalMembers: 0,
            activeBorrowings: 0,
            totalReviews: 0,
            totalBorrowings: 0,
            overdueBooks: 0
        };

        // Load stats with individual error handling
        const promises = [
            // Load total books
            graphqlQuery(API_URLS.book, `
                query {
                    books {
                        id
                        jumlah
                    }
                }
            `).then(data => {
                stats.totalBooks = data.books ? data.books.length : 0;
                console.log('Books stats loaded:', stats.totalBooks);
            }).catch(error => {
                console.warn('Failed to load books stats:', error.message);
                stats.totalBooks = 'N/A';
            }),

            // Load total members
            graphqlQuery(API_URLS.user, `
                query {
                    members {
                        id
                    }
                }
            `).then(data => {
                stats.totalMembers = data.members ? data.members.length : 0;
                console.log('Members stats loaded:', stats.totalMembers);
            }).catch(error => {
                console.warn('Failed to load members stats:', error.message);
                stats.totalMembers = 'N/A';
            }),

            // Load active borrowings and total borrowings and overdue books
            graphqlQuery(API_URLS.borrowing, `
                query {
                    borrowings {
                        id
                        status
                        tanggal_jatuh_tempo
                        tanggal_pengembalian
                    }
                }
            `).then(data => {
                if (data.borrowings) {
                    stats.activeBorrowings = data.borrowings.filter(b => b.status === 'dipinjam').length;
                    stats.totalBorrowings = data.borrowings.length;
                    // Overdue: status dipinjam, jatuh tempo < today, belum dikembalikan
                    const today = new Date().toISOString().split('T')[0];
                    stats.overdueBooks = data.borrowings.filter(b => b.status === 'dipinjam' && b.tanggal_jatuh_tempo < today && !b.tanggal_pengembalian).length;
                } else {
                    stats.activeBorrowings = 0;
                    stats.totalBorrowings = 0;
                    stats.overdueBooks = 0;
                }
                console.log('Borrowings stats loaded:', stats.activeBorrowings, stats.totalBorrowings, stats.overdueBooks);
            }).catch(error => {
                console.warn('Failed to load borrowings stats:', error.message);
                stats.activeBorrowings = 'N/A';
                stats.totalBorrowings = 'N/A';
                stats.overdueBooks = 'N/A';
            }),

            // Load total reviews
            graphqlQuery(API_URLS.review, `
                query {
                    reviews {
                        id
                    }
                }
            `).then(data => {
                stats.totalReviews = data.reviews ? data.reviews.length : 0;
                console.log('Reviews stats loaded:', stats.totalReviews);
            }).catch(error => {
                console.warn('Failed to load reviews stats:', error.message);
                stats.totalReviews = 'N/A';
            })
        ];

        // Wait for all promises to complete (whether successful or failed)
        await Promise.allSettled(promises);

        // Update UI with stats
        updateStatsUI(stats);
        console.log('Dashboard stats loaded:', stats);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showAlert('Gagal memuat statistik dashboard', 'warning');
    }
}

// Update stats UI
function updateStatsUI(stats) {
    const elements = {
        totalBooks: document.getElementById('totalBooks'),
        totalMembers: document.getElementById('totalMembers'),
        activeBorrowings: document.getElementById('activeBorrowings'),
        totalReviews: document.getElementById('totalReviews'),
        totalBorrowings: document.getElementById('totalBorrowings'),
        overdueBooks: document.getElementById('overdueBooks')
    };

    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key];
        }
    });
}

// Load section data based on section name
async function loadSectionData(sectionName) {
    try {
        console.log(`Loading data for section: ${sectionName}`);
        
        switch(sectionName) {
            case 'members':
                if (typeof loadMembers === 'function') {
                    await loadMembers();
                }
                break;
            case 'books':
                if (typeof loadBooks === 'function') {
                    await loadBooks();
                } else {
                    console.error('loadBooks function not found');
                }
                break;
            case 'borrowings':
                if (typeof loadBorrowings === 'function') {
                    await loadBorrowings();
                }
                break;
            case 'reviews':
                if (typeof loadReviews === 'function') {
                    await loadReviews();
                }
                break;
            case 'reports':
                if (typeof displayReports === 'function') {
                    await displayReports();
                }
                break;
            default:
                console.warn(`Unknown section: ${sectionName}`);
        }
    } catch (error) {
        console.error(`Error loading data for section ${sectionName}:`, error);
        showAlert(`Gagal memuat data untuk bagian ${sectionName}: ${error.message}`, 'error');
    }
}

// Enhanced initialization
async function initializeApp() {
    try {
        console.log('Initializing application...');
        
        // Show loading indicator
        showAlert('Memuat aplikasi...', 'info');
        
        // Test backend connectivity first
        const connectivity = await testBackendConnectivity();
        
        // Load dashboard stats
        await loadDashboardStats();
        
        // Show initial section (books for testing)
        showSection('books');
        
        // Clear loading message
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                if (alert.textContent.includes('Memuat aplikasi')) {
                    alert.remove();
                }
            });
        }, 2000);
        
        showAlert('Aplikasi berhasil dimuat!', 'success');
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showAlert('Gagal menginisialisasi aplikasi: ' + error.message, 'error');
    }
}

// Test backend connectivity
async function testBackendConnectivity() {
    console.log('Testing backend connectivity...');
    const services = Object.entries(API_URLS);
    const results = {};
    
    for (const [name, url] of services) {
        try {
            // Simple introspection query
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    query: '{ __schema { types { name } } }' 
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                results[name] = result.errors ? 'Error' : 'Connected';
            } else {
                results[name] = `HTTP ${response.status}`;
            }
        } catch (error) {
            results[name] = 'Failed';
            console.warn(`${name} service (${url}) not available:`, error.message);
        }
    }
    
    console.log('Backend connectivity test results:', results);
    
    // Show connectivity status
    const connectedServices = Object.values(results).filter(status => status === 'Connected').length;
    const totalServices = Object.keys(results).length;
    
    if (connectedServices === 0) {
        showAlert('Tidak ada layanan backend yang tersedia. Pastikan server backend berjalan.', 'error');
    } else if (connectedServices < totalServices) {
        showAlert(`${connectedServices}/${totalServices} layanan backend tersedia.`, 'warning');
    } else {
        showAlert(`Semua layanan backend tersedia (${connectedServices}/${totalServices})`, 'success');
    }
    
    return results;
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    await initializeApp();
});