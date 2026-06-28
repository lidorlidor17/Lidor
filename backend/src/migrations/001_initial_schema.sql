-- Migration 001: Initial schema
-- Created: 2026-06-24
-- Purpose: Foundational tables for the BESS layout tool, per the spec document
-- (מסמך-איפיון-BESS-Layout.md), sections 5.6, 5.7, and the parent_component_id
-- design agreed on for assemblies (battery containing switch/EMS, etc.)

PRAGMA foreign_keys = ON;

-- ===== Layers (DC / AC / Communication) =====
CREATE TABLE layers (
  id          TEXT PRIMARY KEY,      -- e.g. 'dc', 'ac', 'communication'
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,         -- hex color, e.g. '#c2410c'
  description TEXT DEFAULT ''
);

-- ===== Port types (DC input/output, AC input, RJ45, ST, ...) =====
CREATE TABLE port_types (
  id          TEXT PRIMARY KEY,      -- e.g. 'dc-input-output'
  name        TEXT NOT NULL,
  layer_id    TEXT NOT NULL REFERENCES layers(id),
  direction   TEXT NOT NULL CHECK (direction IN ('input', 'output', 'bidirectional')),
  color       TEXT NOT NULL
);

-- Which port types are allowed to connect to which (many-to-many, symmetric in practice
-- but stored as directed pairs so each compatible pair is explicit)
CREATE TABLE port_type_compatibility (
  port_type_id            TEXT NOT NULL REFERENCES port_types(id),
  compatible_port_type_id TEXT NOT NULL REFERENCES port_types(id),
  PRIMARY KEY (port_type_id, compatible_port_type_id)
);

-- ===== Connection types (DC power, AC power, fiber optic, CAT6, ...) =====
CREATE TABLE connection_types (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  layer_id    TEXT NOT NULL REFERENCES layers(id),
  color       TEXT NOT NULL,
  line_width  INTEGER NOT NULL DEFAULT 3,
  line_style  TEXT NOT NULL DEFAULT 'solid'
);

-- ===== Component types (the master catalog: Battery Container, PCS/Inverter, ...) =====
CREATE TABLE component_types (
  id            TEXT PRIMARY KEY,    -- e.g. 'battery-container'
  name          TEXT NOT NULL,
  category      TEXT DEFAULT '',
  icon          TEXT DEFAULT '',
  default_color TEXT DEFAULT '#64748b',
  default_width  INTEGER DEFAULT 220,
  default_height INTEGER DEFAULT 130
);

-- Field *definitions* per component type (e.g. Battery Container -> "manufacturer", "capacityKWh", ...)
-- This is master data only. Actual values live on component_field_values (per instance).
CREATE TABLE component_type_fields (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  component_type_id   TEXT NOT NULL REFERENCES component_types(id),
  field_key           TEXT NOT NULL,     -- e.g. 'capacityKWh' - stable, code-facing name
  label               TEXT NOT NULL,     -- e.g. 'Capacity kWh' - human-facing label
  field_type          TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'select', 'textarea')),
  unit                TEXT DEFAULT '',
  default_value       TEXT DEFAULT '',
  display_order       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (component_type_id, field_key)
);

-- Port *template* definitions per component type (e.g. Battery Container -> "DC bus", "RJ45 comm", ...)
CREATE TABLE component_type_ports (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  component_type_id   TEXT NOT NULL REFERENCES component_types(id),
  port_name           TEXT NOT NULL,
  port_type_id         TEXT NOT NULL REFERENCES port_types(id),
  display_order       INTEGER NOT NULL DEFAULT 0
);

-- ===== Projects (a single BESS site) =====
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ===== Components (actual instances placed on the drawing) =====
-- parent_component_id is the ENTIRE mechanism for assemblies (battery containing
-- a switch/EMS inside it). It is a self-reference to another row in this same
-- table - i.e. a specific instance, not a type. See spec doc section 6, item 2.
CREATE TABLE components (
  id                   TEXT PRIMARY KEY,
  project_id           TEXT NOT NULL REFERENCES projects(id),
  component_type_id    TEXT NOT NULL REFERENCES component_types(id),
  parent_component_id  TEXT REFERENCES components(id),  -- NULL = top-level, not nested in anything
  name                 TEXT NOT NULL,
  x                    REAL NOT NULL DEFAULT 0,   -- position relative to parent if nested, else to canvas
  y                    REAL NOT NULL DEFAULT 0,
  width                REAL,
  height               REAL,
  rotation             REAL NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_components_project ON components(project_id);
CREATE INDEX idx_components_parent ON components(parent_component_id);

-- Actual field *values* per component instance. Normalized: one row per field per
-- component, rather than duplicating columns per type (types have very different
-- fields). field_key matches component_type_fields.field_key for that component's type.
CREATE TABLE component_field_values (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  component_id  TEXT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  field_key     TEXT NOT NULL,
  value         TEXT DEFAULT '',
  UNIQUE (component_id, field_key)
);

-- Actual port *instances* that live on a specific component. Ports always belong
-- to their real owning component - never duplicated/"promoted" to a parent.
CREATE TABLE ports (
  id            TEXT PRIMARY KEY,
  component_id  TEXT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  port_type_id  TEXT NOT NULL REFERENCES port_types(id),
  name          TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_ports_component ON ports(component_id);

-- ===== Connections (cables/wires between two real ports) =====
CREATE TABLE connections (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id),
  connection_type_id  TEXT NOT NULL REFERENCES connection_types(id),
  source_port_id      TEXT NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  target_port_id      TEXT NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  label               TEXT DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_connections_project ON connections(project_id);
CREATE INDEX idx_connections_source_port ON connections(source_port_id);
CREATE INDEX idx_connections_target_port ON connections(target_port_id);
