// Staff sign-in — mirrors signin.js's demo pattern (name-only, no password)
// but picks a department instead of buyer/seller, since Admin accounts are
// scoped to one of three dashboards: Stats & Analytics, Tech Support, or
// Finance.
const introSubtitle = document.getElementById('introSubtitle');
const deptOptions = document.getElementById('deptOptions');
const nameForm = document.getElementById('nameForm');
const nameFormNote = document.getElementById('nameFormNote');

const deptLabels = {
    stats: 'Stats & Analytics',
    techsupport: 'Tech Support',
    finance: 'Finance Department'
};

let selectedDept = null;

function chooseDept(dept) {
    selectedDept = dept;
    nameFormNote.textContent = `Signing in to ${deptLabels[dept]} — confirm a staff name to finish.`;
    deptOptions.classList.add('hidden');
    nameForm.classList.remove('hidden');
}

document.getElementById('deptStatsBtn').addEventListener('click', () => chooseDept('stats'));
document.getElementById('deptSupportBtn').addEventListener('click', () => chooseDept('techsupport'));
document.getElementById('deptFinanceBtn').addEventListener('click', () => chooseDept('finance'));

document.getElementById('backBtn').addEventListener('click', () => {
    nameForm.classList.add('hidden');
    deptOptions.classList.remove('hidden');
});

nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('displayName').value.trim();
    if (!name) return;
    login(name, 'admin', selectedDept);
    window.location.href = 'admin.html';
});
