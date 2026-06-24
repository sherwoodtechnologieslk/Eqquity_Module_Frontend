import React from 'react';
import { PERMISSION_LABELS } from '../../constants/governanceConstants';
import './GovernancePermissionPicker.css';

const MODULE_ACCESS_KEYS = new Set(['trade', 'accounting', 'reports', 'master_data']);

function PermCard({ permission, checked, onToggle }) {
  return (
    <label className={`gov-perm-card${checked ? ' gov-perm-card--on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={() => onToggle(permission.id)} />
      <span className="gov-perm-card-label">
        {PERMISSION_LABELS[permission.permission_key] || permission.permission_key}
      </span>
    </label>
  );
}

function PermGroup({ group, selectedIds, onToggle, onToggleGroup, variant = 'default' }) {
  return (
    <div className={`gov-perm-group gov-perm-group--${variant}`}>
      <div className="gov-perm-group-head">
        <span>{group.title}</span>
        <button type="button" className="gov-perm-link-btn" onClick={() => onToggleGroup(group.items)}>
          Toggle all
        </button>
      </div>
      <div className="gov-perm-grid">
        {group.items.map((p) => (
          <PermCard
            key={p.id}
            permission={p}
            checked={selectedIds.includes(p.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default function GovernancePermissionPicker({
  groupedPermissions,
  selectedIds,
  onToggle,
  onToggleGroup,
}) {
  const governance = groupedPermissions.filter((g) => g.module === 'governance');
  const features = groupedPermissions.find((g) => g.module === 'features');
  const moduleGroups = groupedPermissions.filter((g) => MODULE_ACCESS_KEYS.has(g.module));

  return (
    <div className="gov-perm-picker">
      {governance.map((group) => (
        <PermGroup
          key={group.module}
          group={group}
          variant="compact"
          selectedIds={selectedIds}
          onToggle={onToggle}
          onToggleGroup={onToggleGroup}
        />
      ))}

      {moduleGroups.length > 0 && (
        <div className="gov-perm-band">
          <p className="gov-perm-band-title">Module access (API)</p>
          <div className="gov-perm-module-row">
            {moduleGroups.map((group) => (
              <PermGroup
                key={group.module}
                group={group}
                variant="module"
                selectedIds={selectedIds}
                onToggle={onToggle}
                onToggleGroup={onToggleGroup}
              />
            ))}
          </div>
        </div>
      )}

      {features && (
        <PermGroup
          group={features}
          variant="features"
          selectedIds={selectedIds}
          onToggle={onToggle}
          onToggleGroup={onToggleGroup}
        />
      )}
    </div>
  );
}
