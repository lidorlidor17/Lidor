-- Migration 002: Seed master catalog data
-- Created: 2026-06-24
-- Purpose: Populate layers, port types, connection types, and component types
-- with the field/port lists confirmed in the spec document (section 6, item 1).
-- This is master/reference data - editable later via the schema editor (future),
-- but needs to exist for the app to be usable at all.

-- ===== Layers =====
INSERT INTO layers (id, name, color) VALUES
  ('dc', 'DC', '#c2410c'),
  ('ac', 'AC', '#2563eb'),
  ('communication', 'Communication', '#059669');

-- ===== Port types =====
INSERT INTO port_types (id, name, layer_id, direction, color) VALUES
  ('dc-input-output', 'DC input/output', 'dc', 'bidirectional', '#c2410c'),
  ('ac-output', 'AC output', 'ac', 'output', '#2563eb'),
  ('ac-input', 'AC input', 'ac', 'input', '#2563eb'),
  ('ac-input-output', 'AC input/output', 'ac', 'bidirectional', '#2563eb'),
  ('rj45', 'RJ45', 'communication', 'bidirectional', '#059669'),
  ('st', 'ST', 'communication', 'bidirectional', '#059669');

INSERT INTO port_type_compatibility (port_type_id, compatible_port_type_id) VALUES
  ('dc-input-output', 'dc-input-output'),
  ('ac-output', 'ac-input'),
  ('ac-output', 'ac-input-output'),
  ('ac-input', 'ac-output'),
  ('ac-input', 'ac-input-output'),
  ('ac-input-output', 'ac-output'),
  ('ac-input-output', 'ac-input'),
  ('ac-input-output', 'ac-input-output'),
  ('rj45', 'rj45'),
  ('st', 'st');

-- ===== Connection types =====
INSERT INTO connection_types (id, name, layer_id, color, line_width, line_style) VALUES
  ('dc-power', 'DC power', 'dc', '#c2410c', 3, 'solid'),
  ('ac-power', 'AC power', 'ac', '#2563eb', 3, 'solid'),
  ('fiber-optic', 'Fiber optic', 'communication', '#0e7490', 3, 'solid'),
  ('cat6', 'CAT 6', 'communication', '#2563eb', 3, 'solid');

-- ===== Component types =====
INSERT INTO component_types (id, name, category, default_color, default_width, default_height) VALUES
  ('battery-container', 'Battery Container', 'Storage', '#f97316', 235, 138),
  ('pcs-inverter', 'PCS / Inverter', 'Power Conversion', '#0f766e', 225, 140),
  ('transformer', 'Transformer', 'Grid Interface', '#2563eb', 220, 112),
  ('rmu', 'RMU', 'Grid Interface', '#7c3aed', 210, 112),
  ('electrical-panel', 'Electrical Panel', 'Auxiliary Power', '#ca8a04', 210, 112),
  ('network-switch', 'Network Switch', 'Communication', '#059669', 220, 138),
  ('ems-plc-dio-controller', 'EMS / PLC / DIO Controller', 'Control', '#4b5563', 230, 122);

-- ===== Field definitions per type (spec doc section 1) =====

-- Battery Container
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('battery-container', 'manufacturer', 'Manufacturer', 'text', '', '', 1),
  ('battery-container', 'model', 'Model', 'text', '', '', 2),
  ('battery-container', 'nominalDcVoltage', 'Nominal DC voltage', 'number', 'V', '1500', 3),
  ('battery-container', 'capacityKWh', 'Capacity', 'number', 'kWh', '5640', 4),
  ('battery-container', 'maxCurrent', 'Max current', 'number', 'A', '2400', 5),
  ('battery-container', 'numberOfRacks', 'Number of racks', 'number', '', '12', 6),
  ('battery-container', 'notes', 'Notes', 'textarea', '', '', 7);

-- PCS / Inverter
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('pcs-inverter', 'manufacturer', 'Manufacturer', 'text', '', '', 1),
  ('pcs-inverter', 'model', 'Model', 'text', '', '', 2),
  ('pcs-inverter', 'ratedPowerKW', 'Rated power', 'number', 'kW', '3450', 3),
  ('pcs-inverter', 'dcVoltageRange', 'DC voltage range', 'text', '', '', 4),
  ('pcs-inverter', 'acVoltage', 'AC voltage', 'number', 'V', '690', 5),
  ('pcs-inverter', 'protocol', 'Protocol', 'text', '', '', 6),
  ('pcs-inverter', 'notes', 'Notes', 'textarea', '', '', 7);

-- Transformer
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('transformer', 'ratedPowerKVA', 'Rated power', 'number', 'kVA', '5000', 1),
  ('transformer', 'lowVoltage', 'Low voltage', 'number', 'V', '690', 2),
  ('transformer', 'highVoltage', 'High voltage', 'number', 'V', '33000', 3),
  ('transformer', 'impedancePercent', 'Impedance', 'number', '%', '6', 4),
  ('transformer', 'vectorGroup', 'Vector group', 'text', '', '', 5),
  ('transformer', 'notes', 'Notes', 'textarea', '', '', 6);

-- RMU
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('rmu', 'ratedVoltage', 'Rated voltage', 'number', 'V', '400', 1),
  ('rmu', 'numberOfCells', 'Number of cells', 'number', '', '3', 2),
  ('rmu', 'protectionType', 'Protection type', 'text', '', '', 3),
  ('rmu', 'notes', 'Notes', 'textarea', '', '', 4);

-- Electrical Panel
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('electrical-panel', 'panelType', 'Panel type', 'text', '', '', 1),
  ('electrical-panel', 'voltage', 'Voltage', 'number', 'V', '400', 2),
  ('electrical-panel', 'ratedCurrent', 'Rated current', 'number', 'A', '250', 3),
  ('electrical-panel', 'mainBreaker', 'Main breaker', 'text', '', '', 4),
  ('electrical-panel', 'notes', 'Notes', 'textarea', '', '', 5);

-- Network Switch
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('network-switch', 'manufacturer', 'Manufacturer', 'text', '', '', 1),
  ('network-switch', 'model', 'Model', 'text', '', '', 2),
  ('network-switch', 'numberOfRJ45Ports', 'RJ45 ports', 'number', '', '8', 3),
  ('network-switch', 'numberOfSTPorts', 'ST ports', 'number', '', '2', 4),
  ('network-switch', 'managed', 'Managed', 'boolean', '', 'true', 5),
  ('network-switch', 'ipAddress', 'IP address', 'text', '', '', 6),
  ('network-switch', 'notes', 'Notes', 'textarea', '', '', 7);

-- EMS / PLC / DIO Controller
INSERT INTO component_type_fields (component_type_id, field_key, label, field_type, unit, default_value, display_order) VALUES
  ('ems-plc-dio-controller', 'manufacturer', 'Manufacturer', 'text', '', '', 1),
  ('ems-plc-dio-controller', 'model', 'Model', 'text', '', '', 2),
  ('ems-plc-dio-controller', 'protocol', 'Protocol', 'text', '', '', 3),
  ('ems-plc-dio-controller', 'ipAddress', 'IP address', 'text', '', '', 4),
  ('ems-plc-dio-controller', 'notes', 'Notes', 'textarea', '', '', 5);

-- ===== Port template definitions per type =====

INSERT INTO component_type_ports (component_type_id, port_name, port_type_id, display_order) VALUES
  ('battery-container', 'DC bus', 'dc-input-output', 1),
  ('battery-container', 'Aux AC input', 'ac-input', 2),
  ('battery-container', 'RJ45 comm', 'rj45', 3),
  ('battery-container', 'ST comm', 'st', 4),

  ('pcs-inverter', 'DC input/output', 'dc-input-output', 1),
  ('pcs-inverter', 'AC output', 'ac-output', 2),
  ('pcs-inverter', 'Aux AC input', 'ac-input', 3),
  ('pcs-inverter', 'RJ45', 'rj45', 4),
  ('pcs-inverter', 'ST', 'st', 5),

  ('transformer', 'AC input', 'ac-input', 1),
  ('transformer', 'AC output', 'ac-output', 2),

  ('rmu', 'AC input/output', 'ac-input-output', 1),
  ('rmu', 'RJ45', 'rj45', 2),
  ('rmu', 'ST', 'st', 3),

  ('electrical-panel', 'AC input', 'ac-input', 1),
  ('electrical-panel', 'AC output', 'ac-output', 2),

  ('network-switch', 'RJ45 1', 'rj45', 1),
  ('network-switch', 'RJ45 2', 'rj45', 2),
  ('network-switch', 'RJ45 3', 'rj45', 3),
  ('network-switch', 'RJ45 4', 'rj45', 4),
  ('network-switch', 'ST 1', 'st', 5),
  ('network-switch', 'ST 2', 'st', 6),

  ('ems-plc-dio-controller', 'RJ45', 'rj45', 1),
  ('ems-plc-dio-controller', 'ST', 'st', 2),
  ('ems-plc-dio-controller', 'AC input/output', 'ac-input-output', 3);
