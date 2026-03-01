'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/clientApp';
import { isAdminEmail } from '@/lib/adminConfig';
import { styled } from '@/styles/stitches.config';
import PageWrapper from '@/components/layout/PageWrapper';
import AdminContainer from '@/components/layout/AdminContainer';
const TABS = ['Dashboard', 'Pitchers', 'Listeners', 'Meetings', 'Fund History'] as const;
type Tab = (typeof TABS)[number];

const TAB_KEYS: Record<Tab, string> = {
  Dashboard: 'dashboard',
  Pitchers: 'pitchers',
  Listeners: 'listeners',
  Meetings: 'meetings',
  'Fund History': 'fund_history',
};

const PITCHER_EDIT_FIELDS = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  { key: 'pitch', label: 'Pitch', type: 'textarea' },
  { key: 'donation', label: 'Donation ($)', type: 'number' },
  { key: 'credit_balance', label: 'Balance ($)', type: 'number' },
  { key: 'isSetUp', label: 'Set Up', type: 'select' },
] as const;

const LISTENER_EDIT_FIELDS = [
  { key: 'fullName', label: 'Full Name', type: 'text' },
  { key: 'intro', label: 'Intro', type: 'textarea' },
  { key: 'donation', label: 'Donation ($)', type: 'number' },
  { key: 'isSetUp', label: 'Set Up', type: 'select' },
] as const;

const Title = styled('h1', {
  fontSize: '$xxl',
  color: '$dark',
  margin: 0,
});

const TabBar = styled('div', {
  display: 'flex',
  gap: '$sm',
  flexWrap: 'wrap',
  borderBottom: '2px solid $light',
  paddingBottom: '$sm',
});

const TabButton = styled('button', {
  padding: '$sm $md',
  fontSize: '$base',
  fontWeight: '500',
  border: 'none',
  borderRadius: '$sm',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '$dark',
  '&:hover': {
    backgroundColor: '$light',
  },
  variants: {
    active: {
      true: {
        backgroundColor: '$heart',
        color: '$white',
        '&:hover': {
          backgroundColor: '$heart',
        },
      },
    },
  },
});

const StatsGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '$md',
});

const StatCard = styled('div', {
  backgroundColor: '$light',
  borderRadius: '$md',
  padding: '$md',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const StatValue = styled('div', {
  fontSize: '$xxl',
  fontWeight: 'bold',
  color: '$dark',
});

const StatLabel = styled('div', {
  fontSize: '$base',
  color: '$darkgray',
});

const StatDetail = styled('div', {
  fontSize: '14px',
  color: '$mediumgray',
});

const Table = styled('table', {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
});

const Th = styled('th', {
  textAlign: 'left',
  padding: '$sm',
  borderBottom: '2px solid $light',
  color: '$dark',
  fontWeight: '600',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    color: '$heart',
  },
});

const Td = styled('td', {
  padding: '$sm',
  borderBottom: '1px solid $light',
  color: '$darkgray',
  maxWidth: '200px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const ErrorText = styled('p', {
  color: '$heart',
  fontSize: '$base',
});

const ActionButton = styled('button', {
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: '500',
  border: 'none',
  borderRadius: '$sm',
  cursor: 'pointer',
  color: '$white',
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  variants: {
    variant: {
      edit: { backgroundColor: '#3b82f6', '&:hover:not(:disabled)': { backgroundColor: '#2563eb' } },
      delete: { backgroundColor: '$heart', '&:hover:not(:disabled)': { backgroundColor: '#dc2626' } },
      restore: { backgroundColor: '#22c55e', '&:hover:not(:disabled)': { backgroundColor: '#16a34a' } },
    },
  },
});

const Overlay = styled('div', {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
});

const Modal = styled('div', {
  backgroundColor: '$white',
  borderRadius: '$md',
  padding: '$lg',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '$md',
});

const ModalTitle = styled('h2', {
  fontSize: '$lg',
  color: '$dark',
  margin: 0,
});

const FormGroup = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const FormLabel = styled('label', {
  fontSize: '14px',
  fontWeight: '500',
  color: '$dark',
});

const FormInput = styled('input', {
  padding: '$sm',
  fontSize: '$base',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  '&:focus': { borderColor: '$heart', outline: 'none' },
});

const FormTextarea = styled('textarea', {
  padding: '$sm',
  fontSize: '$base',
  fontFamily: 'inherit',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  resize: 'vertical',
  '&:focus': { borderColor: '$heart', outline: 'none' },
});

const FormSelect = styled('select', {
  padding: '$sm',
  fontSize: '$base',
  borderRadius: '$sm',
  border: '1px solid #ccc',
  '&:focus': { borderColor: '$heart', outline: 'none' },
});

const ModalActions = styled('div', {
  display: 'flex',
  gap: '$sm',
  justifyContent: 'flex-end',
});

const ModalButton = styled('button', {
  padding: '$sm $md',
  fontSize: '$base',
  fontWeight: '500',
  border: 'none',
  borderRadius: '$sm',
  cursor: 'pointer',
  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  variants: {
    variant: {
      primary: { backgroundColor: '#3b82f6', color: '$white', '&:hover:not(:disabled)': { backgroundColor: '#2563eb' } },
      danger: { backgroundColor: '$heart', color: '$white', '&:hover:not(:disabled)': { backgroundColor: '#dc2626' } },
      cancel: { backgroundColor: '$light', color: '$dark', '&:hover': { backgroundColor: '#e5e7eb' } },
    },
  },
});

const WarningText = styled('p', {
  fontSize: '14px',
  color: '$darkgray',
  lineHeight: 1.5,
});

type SortConfig = { key: string; direction: 'asc' | 'desc' };

function formatTimestamp(ts: unknown): string {
  if (!ts) return '—';
  if (typeof ts === 'object' && ts !== null && '_seconds' in ts) {
    const d = new Date((ts as { _seconds: number })._seconds * 1000);
    return d.toLocaleString();
  }
  if (typeof ts === 'string') return new Date(ts).toLocaleString();
  return '—';
}

function sortData<T extends Record<string, unknown>>(data: T[], sort: SortConfig | null): T[] {
  if (!sort) return data;
  return [...data].sort((a, b) => {
    let aVal = a[sort.key];
    let bVal = b[sort.key];
    // Handle Firestore timestamp objects
    if (aVal && typeof aVal === 'object' && '_seconds' in aVal) aVal = (aVal as { _seconds: number })._seconds;
    if (bVal && typeof bVal === 'object' && '_seconds' in bVal) bVal = (bVal as { _seconds: number })._seconds;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sort.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
}

type DashboardData = {
  totalPitchers: number;
  pitchersSetUp: number;
  totalListeners: number;
  listenersSetUp: number;
  activePitchers: number;
  totalMeetings: number;
  meetingsByStatus: Record<string, number>;
  totalFundsRaised: number;
  totalTransactions: number;
};

type EditState = {
  row: Record<string, unknown>;
  collection: string;
} | null;

type DeleteState = {
  row: Record<string, unknown>;
  collection: string;
} | null;

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  // Edit modal state
  const [editState, setEditState] = useState<EditState>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation state
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Restore loading state (track by row id)
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!isAdminEmail(user.email)) {
        router.push('/choose-a-profile');
        return;
      }
      const idToken = await user.getIdToken();
      setToken(idToken);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!token) return;
    setError('');

    const tabKey = TAB_KEYS[activeTab];
    fetch(`/api/admin?tab=${tabKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (tabKey === 'dashboard') {
          setDashboardData(json.data);
          setTableData([]);
        } else {
          setTableData(json.data);
          setDashboardData(null);
        }
        setSort(null);
      })
      .catch((err) => setError(err.message));
  }, [token, activeTab]);

  const sortedData = useMemo(() => sortData(tableData, sort), [tableData, sort]);

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const sortIndicator = (key: string) => {
    if (sort?.key !== key) return '';
    return sort.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const isDeleted = (row: Record<string, unknown>) => !!row.deletedAt;

  const getCollectionKey = () => TAB_KEYS[activeTab];

  // Edit handlers
  const openEdit = (row: Record<string, unknown>) => {
    const collection = getCollectionKey();
    setEditState({ row, collection });
    // Initialize form with current values
    const fields = collection === 'pitchers' ? PITCHER_EDIT_FIELDS : LISTENER_EDIT_FIELDS;
    const form: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.key === 'isSetUp') {
        form[f.key] = row[f.key] === false ? 'false' : 'true';
      } else if (f.key === 'donation' || f.key === 'credit_balance') {
        form[f.key] = row[f.key] ?? 0;
      } else {
        form[f.key] = row[f.key] ?? '';
      }
    }
    setEditForm(form);
  };

  const handleEditSave = useCallback(async () => {
    if (!editState || !token) return;
    setEditSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      const fields = editState.collection === 'pitchers' ? PITCHER_EDIT_FIELDS : LISTENER_EDIT_FIELDS;
      for (const f of fields) {
        if (f.key === 'isSetUp') {
          body[f.key] = editForm[f.key] === 'true';
        } else if (f.type === 'number') {
          body[f.key] = parseFloat(String(editForm[f.key])) || 0;
        } else {
          body[f.key] = editForm[f.key];
        }
      }

      const res = await fetch(`/api/admin/${editState.collection}/${editState.row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const { data: updated } = await res.json();

      // Update row in-place in tableData
      setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditState(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
    } finally {
      setEditSaving(false);
    }
  }, [editState, editForm, token]);

  // Delete handlers
  const openDelete = (row: Record<string, unknown>) => {
    setDeleteState({ row, collection: getCollectionKey() });
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState || !token) return;
    setDeleteLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/${deleteState.collection}/${deleteState.row.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API error: ${res.status}`);
      }

      // Update row in-place: mark as deleted
      setTableData((prev) =>
        prev.map((r) =>
          r.id === deleteState.row.id
            ? { ...r, deletedAt: { _seconds: Math.floor(Date.now() / 1000) }, isSetUp: false }
            : r
        )
      );
      setDeleteState(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setError(msg);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteState, token]);

  // Restore handler
  const handleRestore = useCallback(async (row: Record<string, unknown>) => {
    if (!token) return;
    const collection = getCollectionKey();
    setRestoringId(row.id as string);
    setError('');
    try {
      const res = await fetch(`/api/admin/${collection}/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isSetUp: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const { data: updated } = await res.json();
      setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restore';
      setError(msg);
    } finally {
      setRestoringId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  if (loading) return <PageWrapper><p>Loading...</p></PageWrapper>;

  const pitcherColumns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'donation', label: 'Donation' },
    { key: 'credit_balance', label: 'Balance' },
    { key: 'isSetUp', label: 'Set Up' },
    { key: 'slug', label: 'Slug' },
    { key: 'createdAt', label: 'Created' },
  ];

  const listenerColumns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'donation', label: 'Donation' },
    { key: 'intro', label: 'Intro' },
    { key: 'isSetUp', label: 'Set Up' },
    { key: 'slug', label: 'Slug' },
    { key: 'createdAt', label: 'Created' },
  ];

  const meetingColumns = [
    { key: 'pitcherName', label: 'Pitcher' },
    { key: 'listenerName', label: 'Listener' },
    { key: 'meetingsource', label: 'Source' },
    { key: 'status', label: 'Status' },
    { key: 'availability', label: 'Availability' },
    { key: 'createdAt', label: 'Created' },
  ];

  const fundHistoryColumns = [
    { key: 'pitcherEmail', label: 'Pitcher' },
    { key: 'amount', label: 'Amount' },
    { key: 'eventType', label: 'Event Type' },
    { key: 'paymentIntentRefId', label: 'PayPal Order ID' },
    { key: 'timestamp', label: 'Timestamp' },
  ];

  const columnMap: Record<string, { key: string; label: string }[]> = {
    Pitchers: pitcherColumns,
    Listeners: listenerColumns,
    Meetings: meetingColumns,
    'Fund History': fundHistoryColumns,
  };

  function formatCell(key: string, value: unknown): string {
    if (key === 'createdAt' || key === 'timestamp') return formatTimestamp(value);
    if (key === 'isSetUp') return value === false ? 'No' : 'Yes';
    if (key === 'donation' || key === 'credit_balance' || key === 'amount') {
      return typeof value === 'number' ? `$${value.toFixed(2)}` : '—';
    }
    if (value == null) return '—';
    return String(value);
  }

  const hasActions = activeTab === 'Pitchers' || activeTab === 'Listeners';

  const renderTable = (columns: { key: string; label: string }[]) => (
    <div style={{ overflowX: 'auto' }}>
      <Table>
        <thead>
          <tr>
            {columns.map((col) => (
              <Th key={col.key} onClick={() => handleSort(col.key)}>
                {col.label}
                {sortIndicator(col.key)}
              </Th>
            ))}
            {hasActions && <Th style={{ cursor: 'default' }}>Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <Td colSpan={columns.length + (hasActions ? 1 : 0)} style={{ textAlign: 'center' }}>
                No data
              </Td>
            </tr>
          ) : (
            sortedData.map((row, i) => {
              const deleted = isDeleted(row);
              return (
                <tr
                  key={(row.id as string) || i}
                  style={deleted ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}
                >
                  {columns.map((col) => (
                    <Td key={col.key} title={String(row[col.key] ?? '')}>
                      {formatCell(col.key, row[col.key])}
                    </Td>
                  ))}
                  {hasActions && (
                    <Td style={{ whiteSpace: 'nowrap', maxWidth: 'none' }}>
                      {deleted ? (
                        <ActionButton
                          variant="restore"
                          disabled={restoringId === (row.id as string)}
                          onClick={() => handleRestore(row)}
                        >
                          {restoringId === (row.id as string) ? 'Restoring...' : 'Restore'}
                        </ActionButton>
                      ) : (
                        <span style={{ display: 'flex', gap: '6px' }}>
                          <ActionButton variant="edit" onClick={() => openEdit(row)}>
                            Edit
                          </ActionButton>
                          <ActionButton variant="delete" onClick={() => openDelete(row)}>
                            Delete
                          </ActionButton>
                        </span>
                      )}
                    </Td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );

  const editFields = editState?.collection === 'pitchers' ? PITCHER_EDIT_FIELDS : LISTENER_EDIT_FIELDS;

  return (
    <PageWrapper>
      <AdminContainer>
        <Title>Admin Dashboard</Title>

        <TabBar>
          {TABS.map((tab) => (
            <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </TabButton>
          ))}
        </TabBar>

        {error && <ErrorText>{error}</ErrorText>}

        {activeTab === 'Dashboard' && dashboardData && (
          <StatsGrid>
            <StatCard>
              <StatValue>{dashboardData.totalPitchers}</StatValue>
              <StatLabel>Total Pitchers</StatLabel>
              <StatDetail>{dashboardData.pitchersSetUp} set up</StatDetail>
            </StatCard>
            <StatCard>
              <StatValue>{dashboardData.totalListeners}</StatValue>
              <StatLabel>Total Listeners</StatLabel>
              <StatDetail>{dashboardData.listenersSetUp} set up</StatDetail>
            </StatCard>
            <StatCard>
              <StatValue>{dashboardData.activePitchers}</StatValue>
              <StatLabel>Active Pitchers</StatLabel>
              <StatDetail>Sufficient balance</StatDetail>
            </StatCard>
            <StatCard>
              <StatValue>{dashboardData.totalMeetings}</StatValue>
              <StatLabel>Total Meetings</StatLabel>
              <StatDetail>
                {Object.entries(dashboardData.meetingsByStatus)
                  .map(([status, count]) => `${count} ${status}`)
                  .join(', ') || 'None'}
              </StatDetail>
            </StatCard>
            <StatCard>
              <StatValue>${dashboardData.totalFundsRaised.toFixed(2)}</StatValue>
              <StatLabel>Total Funds Raised</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{dashboardData.totalTransactions}</StatValue>
              <StatLabel>Total Transactions</StatLabel>
            </StatCard>
          </StatsGrid>
        )}

        {activeTab !== 'Dashboard' && columnMap[activeTab] && renderTable(columnMap[activeTab])}
      </AdminContainer>

      {/* Edit Modal */}
      {editState && (
        <Overlay onClick={() => !editSaving && setEditState(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              Edit {editState.collection === 'pitchers' ? 'Pitcher' : 'Listener'}
            </ModalTitle>
            <FormGroup>
              <FormLabel>Email (read-only)</FormLabel>
              <FormInput value={String(editState.row.email ?? '')} disabled />
            </FormGroup>
            {editFields.map((field) => (
              <FormGroup key={field.key}>
                <FormLabel>{field.label}</FormLabel>
                {field.type === 'textarea' ? (
                  <FormTextarea
                    rows={3}
                    value={String(editForm[field.key] ?? '')}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : field.type === 'select' ? (
                  <FormSelect
                    value={String(editForm[field.key] ?? 'true')}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </FormSelect>
                ) : (
                  <FormInput
                    type={field.type}
                    step={field.type === 'number' ? '0.01' : undefined}
                    value={String(editForm[field.key] ?? '')}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </FormGroup>
            ))}
            <ModalActions>
              <ModalButton variant="cancel" onClick={() => setEditState(null)} disabled={editSaving}>
                Cancel
              </ModalButton>
              <ModalButton variant="primary" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save'}
              </ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {/* Delete Confirmation */}
      {deleteState && (
        <Overlay onClick={() => !deleteLoading && setDeleteState(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirm Delete</ModalTitle>
            <WarningText>
              Are you sure you want to delete <strong>{String(deleteState.row.fullName)}</strong> ({String(deleteState.row.email)})?
            </WarningText>
            <WarningText>
              This is a soft delete. The profile will be hidden but data preserved.
              The user may also have a {deleteState.collection === 'pitchers' ? 'listener' : 'pitcher'} profile which will NOT be affected.
            </WarningText>
            <ModalActions>
              <ModalButton variant="cancel" onClick={() => setDeleteState(null)} disabled={deleteLoading}>
                Cancel
              </ModalButton>
              <ModalButton variant="danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </PageWrapper>
  );
}
