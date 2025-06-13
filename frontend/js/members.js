// Members Functions
async function loadMembers() {
    try {
        const data = await graphqlQuery(API_URLS.user, `
            query {
                members {
                    id
                    name
                    phone_number
                }
            }
        `);

        // Update members table
        const tbody = document.querySelector('#membersTable tbody');
        if (!tbody) {
            console.error('Members table tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        data.members.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.phone_number || '-'}</td>
                <td>
                    <button onclick="viewMemberDetails(${member.id})" class="btn btn-info btn-sm">Detail</button>
                    <button onclick="viewMemberBorrowings(${member.id})" class="btn btn-primary btn-sm">Riwayat</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update member select dropdowns
        const selectElements = ['selectMember', 'borrowMember', 'reviewMember'];
        selectElements.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Pilih anggota...</option>';
                data.members.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error loading members:', error);
        showAlert('Gagal memuat data anggota: ' + error.message, 'error');
    }
}

async function viewMemberDetails(memberId) {
    try {
        const data = await graphqlQuery(API_URLS.user, `
            query {
                member(id: ${memberId}) {
                    id
                    name
                    phone_number
                }
            }
        `);

        if (!data.member) {
            showAlert('Data anggota tidak ditemukan', 'error');
            return;
        }

        const member = data.member;
        const detailsSection = document.getElementById('memberDetailsSection');
        const detailsContent = document.getElementById('memberDetailsContent');
        
        detailsContent.innerHTML = `
            <div class="member-details">
                <p><strong>ID:</strong> ${member.id}</p>
                <p><strong>Nama:</strong> ${member.name}</p>
                <p><strong>Nomor Telepon:</strong> ${member.phone_number || '-'}</p>
            </div>
        `;
        
        // Hide borrowings section if visible
        document.getElementById('memberBorrowingsSection').style.display = 'none';
        // Show details section
        detailsSection.style.display = 'block';
        
        // Scroll to details section
        detailsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading member details:', error);
        showAlert('Gagal memuat detail anggota: ' + error.message, 'error');
    }
}

async function viewMemberBorrowings(memberId) {
    try {
        const data = await graphqlQuery(API_URLS.user, `
            query {
                member(id: ${memberId}) {
                    id
                    name
                    borrowings {
                        id
                        book_id
                        tanggal_peminjaman
                        status
                    }
                }
            }
        `);

        if (!data.member) {
            showAlert('Data anggota tidak ditemukan', 'error');
            return;
        }

        const member = data.member;
        const borrowingsSection = document.getElementById('memberBorrowingsSection');
        const borrowingsContent = document.getElementById('memberBorrowingsContent');
        
        const borrowingsList = member.borrowings && member.borrowings.length > 0 
            ? member.borrowings.map(b => `
                <tr>
                    <td>${b.id}</td>
                    <td>${b.book_id}</td>
                    <td>${b.tanggal_peminjaman}</td>
                    <td><span class="badge ${b.status === 'dipinjam' ? 'bg-warning' : 'bg-success'}">${b.status}</span></td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="text-center">Tidak ada riwayat peminjaman</td></tr>';
        
        borrowingsContent.innerHTML = `
            <h5>Riwayat Peminjaman - ${member.name}</h5>
            <div class="table-container">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ID Buku</th>
                            <th>Tanggal Peminjaman</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${borrowingsList}
                    </tbody>
                </table>
            </div>
        `;
        
        // Hide details section if visible
        document.getElementById('memberDetailsSection').style.display = 'none';
        // Show borrowings section
        borrowingsSection.style.display = 'block';
        
        // Scroll to borrowings section
        borrowingsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading member borrowings:', error);
        showAlert('Gagal memuat riwayat peminjaman: ' + error.message, 'error');
    }
}

// Close functions
function closeDetails() {
    document.getElementById('memberDetailsSection').style.display = 'none';
}

function closeBorrowings() {
    document.getElementById('memberBorrowingsSection').style.display = 'none';
}

// Create modals dynamically if they don't exist
function createMemberDetailsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'memberDetailsModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Detail Anggota</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function createMemberBorrowingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'memberBorrowingsModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Riwayat Peminjaman</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Register new member - Fixed mutation syntax
async function registerMember(e) {
    e.preventDefault();
    const name = document.getElementById('memberName').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();

    if (!name) {
        showAlert('Nama anggota harus diisi!', 'error');
        return;
    }

    try {
        // Escape quotes in name to prevent GraphQL syntax errors
        const escapedName = name.replace(/"/g, '\\"');
        const escapedPhone = phone.replace(/"/g, '\\"');
        
        const data = await graphqlQuery(API_URLS.user, `
            mutation {
                registerMember(name: "${escapedName}", phone: "${escapedPhone}") {
                    id
                    name
                    phone_number
                }
            }
        `);

        if (data.registerMember) {
            showAlert('Anggota berhasil didaftarkan!', 'success');
            e.target.reset();
            await loadMembers(); // Reload the members list
        }
    } catch (error) {
        console.error('Error registering member:', error);
        showAlert('Gagal mendaftarkan anggota: ' + error.message, 'error');
    }
}

// Update member - Fixed mutation syntax
async function updateMember(e) {
    e.preventDefault();
    const id = document.getElementById('selectMember').value;
    const name = document.getElementById('updateName').value.trim();
    const phone = document.getElementById('updatePhone').value.trim();

    if (!id) {
        showAlert('Pilih anggota terlebih dahulu!', 'error');
        return;
    }

    if (!name && !phone) {
        showAlert('Minimal satu field harus diisi untuk update!', 'error');
        return;
    }

    try {
        // Build mutation parameters dynamically
        let mutationParams = [];
        let mutationArgs = [`id: ${id}`];
        
        if (name) {
            const escapedName = name.replace(/"/g, '\\"');
            mutationArgs.push(`name: "${escapedName}"`);
        }
        
        if (phone) {
            const escapedPhone = phone.replace(/"/g, '\\"');
            mutationArgs.push(`phone: "${escapedPhone}"`);
        }

        const data = await graphqlQuery(API_URLS.user, `
            mutation {
                updateMember(${mutationArgs.join(', ')}) {
                    id
                    name
                    phone_number
                }
            }
        `);

        if (data.updateMember) {
            showAlert('Data anggota berhasil diperbarui!', 'success');
            e.target.reset();
            await loadMembers(); // Reload the members list
        }
    } catch (error) {
        console.error('Error updating member:', error);
        showAlert('Gagal memperbarui data anggota: ' + error.message, 'error');
    }
}

// Event Listeners - Fixed to properly bind events
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const updateForm = document.getElementById('updateMemberForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', registerMember);
    }
    
    if (updateForm) {
        updateForm.addEventListener('submit', updateMember);
    }
    
    // Load members when page loads
    loadMembers();
});