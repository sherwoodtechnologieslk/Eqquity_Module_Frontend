import React from 'react';
import WealthOpsWorkbench from '../shared/WealthOpsWorkbench';

const UserManagement = () => (
  <WealthOpsWorkbench
    title="User Management"
    blurb="Wealth-ops users, roles, and last login — RM, checker, fund accounting, and compliance desks."
    seedRows={[
      { id: 'USR-014', name: 'N. Fernando', email: 'n.fernando@sherwood.lk', role: 'Fund accounting', desk: 'NAV', lastLogin: '2026-08-21 10:12', status: 'Active', notes: '' },
      { id: 'USR-011', name: 'S. Jayasuriya', email: 's.jayasuriya@sherwood.lk', role: 'Checker', desk: 'Dealing', lastLogin: '2026-08-21 09:40', status: 'Active', notes: '' },
      { id: 'USR-008', name: 'C. Perera', email: 'c.perera@sherwood.lk', role: 'Compliance', desk: 'KYC', lastLogin: '2026-08-20 16:02', status: 'Active', notes: '' },
      { id: 'USR-006', name: 'A. Sehansa', email: 'a.sehansa@sherwood.lk', role: 'RM', desk: 'Private clients', lastLogin: '2026-08-21 08:55', status: 'Active', notes: '' },
      { id: 'USR-003', name: 'Guest ops', email: 'ops.guest@sherwood.lk', role: 'Viewer', desk: 'Ops', lastLogin: '2026-07-02 11:18', status: 'Inactive', notes: 'Contractor ended' },
    ]}
    stats={(rows) => [
      { k: 'Users', v: rows.length, m: 'On this company', focus: true },
      { k: 'Active', v: rows.filter((r) => r.status === 'Active').length, m: 'Can sign in' },
      { k: 'Inactive', v: rows.filter((r) => r.status === 'Inactive').length, m: 'Disabled' },
      { k: 'Roles', v: new Set(rows.map((r) => r.role)).size, m: 'Distinct' },
    ]}
    statusTabs={['All', 'Active', 'Inactive']}
    extraFilter={{ key: 'role', label: 'Role' }}
    searchKeys={['id', 'name', 'email', 'role', 'desk']}
    searchPlaceholder="Search name, email, role…"
    columns={[
      { key: 'name', label: 'User', sub: 'email' },
      { key: 'role', label: 'Role' },
      { key: 'desk', label: 'Desk' },
      { key: 'lastLogin', label: 'Last login' },
      { key: 'status', label: 'Status', badge: true },
    ]}
    boardTitle="Wealth users"
    detailTitle={(r) => r.name}
    detailSubtitle={(r) => r.email}
    detailFields={[
      { k: 'Role', get: (r) => r.role },
      { k: 'Desk', get: (r) => r.desk },
      { k: 'Last login', get: (r) => r.lastLogin },
      { k: 'User ID', get: (r) => r.id },
    ]}
    statusActions={{
      Active: [{ label: 'Disable', status: 'Inactive', variant: 'danger' }],
      Inactive: [{ label: 'Enable', status: 'Active', variant: 'solid' }],
    }}
  />
);

export default UserManagement;
