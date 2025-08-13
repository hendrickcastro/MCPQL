import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { connectDB, closePool } from '../db.js';
// Importar las herramientas directamente de los mdulos especficos en lugar de mcp-server.js
// Esto permite que los tests sigan funcionando mientras mantenemos la API pblica simplificada
// Importaciones de herramientas de anlisis de tablas
import { mcp_table_analysis, mcp_get_columns, mcp_get_primary_keys, mcp_get_foreign_keys, mcp_get_indexes, mcp_get_constraints, mcp_get_all_table_info } from '../tools/tableAnalysis.js';
// Importaciones de herramientas de anlisis de procedimientos almacenados
import { mcp_sp_structure, mcp_get_sp_info, mcp_get_sp_parameters, mcp_get_sp_dependencies, mcp_get_sp_definition, mcp_get_sp_complete_structure, mcp_get_sp_definition_simple, mcp_get_sp_parameters_simple, mcp_get_sp_dependencies_simple, mcp_get_sp_all_info_simple } from '../tools/storedProcedureAnalysis.js';
// Importaciones de herramientas de operacin de datos
import { mcp_execute_procedure, mcp_execute_query, mcp_preview_data, mcp_preview_data_enhanced, mcp_get_column_stats, mcp_get_sample_values, mcp_get_column_stats_enhanced, mcp_quick_data_analysis } from '../tools/dataOperations.js';
// Importaciones de herramientas de bsqueda
import { mcp_get_dependencies, mcp_search_objects_by_name, mcp_search_in_definitions, mcp_search_objects_by_type, mcp_get_object_dependencies, mcp_search_comprehensive } from '../tools/objectSearch.js';
import Table from 'cli-table3';
import chalk from 'chalk';
describe('MCP SQL Server Tools - Comprehensive Analysis', () => {
    beforeAll(async () => {
        try {
            console.log(chalk.blue(' Connecting to database...'));
            await connectDB();
            console.log(chalk.green(' Database connection established!'));
        }
        catch (error) {
            console.warn('Database connection failed in tests:', error);
        }
    });
    afterAll(async () => {
        console.log(chalk.blue(' Closing database connection...'));
        await closePool();
    });
    describe(' Individual Table Analysis Functions - Python Style', () => {
        const testTable = '[api].[Idiomas]';
        it('should get detailed column information', async () => {
            console.log(`\n Getting columns for ${testTable}...`);
            const result = await mcp_get_columns({ table_name: testTable });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBeGreaterThan(0);
                console.log(chalk.blue('\n Detailed Column Information:'));
                const table = new Table({
                    head: ['Column', 'Type', 'Max Length', 'Precision', 'Scale', 'Nullable', 'Identity', 'Computed', 'Description'],
                    colWidths: [12, 15, 12, 10, 8, 10, 10, 10, 15],
                    style: { head: ['cyan'] }
                });
                result.data.forEach((col) => {
                    table.push([
                        col.column_name || 'N/A',
                        col.data_type || 'N/A',
                        col.max_length?.toString() || 'N/A',
                        col.precision?.toString() || 'N/A',
                        col.scale?.toString() || 'N/A',
                        col.is_nullable ? 'Yes' : 'No',
                        col.is_identity ? 'Yes' : 'No',
                        col.is_computed ? 'Yes' : 'No',
                        col.description ? col.description.substring(0, 12) + '...' : 'None'
                    ]);
                });
                console.log(table.toString());
                // Verify expected columns exist
                const columnNames = result.data.map((col) => col.column_name);
                expect(columnNames).toContain('Code');
                expect(columnNames).toContain('Description');
            }
        });
        it('should get primary key information', async () => {
            console.log(`\n Getting primary keys for ${testTable}...`);
            const result = await mcp_get_primary_keys({ table_name: testTable });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.blue('\n Primary Key Information:'));
                if (result.data.length > 0) {
                    const table = new Table({
                        head: ['Index Name', 'Column Name', 'Key Ordinal'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((pk) => {
                        table.push([
                            pk.index_name || 'N/A',
                            pk.column_name || 'N/A',
                            pk.key_ordinal?.toString() || 'N/A'
                        ]);
                    });
                    console.log(table.toString());
                }
                else {
                    console.log(chalk.yellow('   No primary keys found'));
                }
            }
        });
        it('should get foreign key information', async () => {
            console.log(`\n Getting foreign keys for ${testTable}...`);
            const result = await mcp_get_foreign_keys({ table_name: testTable });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.blue('\n Foreign Key Information:'));
                if (result.data.length > 0) {
                    const table = new Table({
                        head: ['Constraint', 'Parent Column', 'Referenced Table', 'Referenced Column', 'Delete Action', 'Update Action'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((fk) => {
                        table.push([
                            fk.constraint_name || 'N/A',
                            fk.parent_column || 'N/A',
                            `${fk.referenced_schema}.${fk.referenced_table}` || 'N/A',
                            fk.referenced_column || 'N/A',
                            fk.delete_referential_action_desc || 'N/A',
                            fk.update_referential_action_desc || 'N/A'
                        ]);
                    });
                    console.log(table.toString());
                }
                else {
                    console.log(chalk.yellow('   No foreign keys found'));
                }
            }
        });
        it('should get index information', async () => {
            console.log(`\n Getting indexes for ${testTable}...`);
            const result = await mcp_get_indexes({ table_name: testTable });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.blue('\n Index Information:'));
                if (result.data.length > 0) {
                    const table = new Table({
                        head: ['Index Name', 'Type', 'Unique', 'Primary Key', 'Columns', 'Included Columns'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((idx) => {
                        table.push([
                            idx.index_name || 'N/A',
                            idx.index_type || 'N/A',
                            idx.is_unique ? 'Yes' : 'No',
                            idx.is_primary_key ? 'Yes' : 'No',
                            idx.columns || 'N/A',
                            idx.included_columns || 'None'
                        ]);
                    });
                    console.log(table.toString());
                }
                else {
                    console.log(chalk.yellow('   No indexes found'));
                }
            }
        });
        it('should get constraint information', async () => {
            console.log(`\n Getting constraints for ${testTable}...`);
            const result = await mcp_get_constraints({ table_name: testTable });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.blue('\n Constraint Information:'));
                if (result.data.length > 0) {
                    const table = new Table({
                        head: ['Constraint Name', 'Type', 'Column', 'Definition'],
                        colWidths: [25, 20, 15, 30],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((constraint) => {
                        table.push([
                            constraint.constraint_name || 'N/A',
                            constraint.constraint_type || 'N/A',
                            constraint.column_name || 'N/A',
                            constraint.constraint_definition ?
                                constraint.constraint_definition.substring(0, 27) + '...' : 'N/A'
                        ]);
                    });
                    console.log(table.toString());
                }
                else {
                    console.log(chalk.yellow('   No constraints found'));
                }
            }
        });
        it('should get all table info in one call', async () => {
            console.log(`\n Getting ALL table info for ${testTable}...`);
            const result = await mcp_get_all_table_info({ table_name: testTable });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.green('\n Complete Table Analysis Summary:'));
                console.log(`    Columns: ${result.data.columns.length}`);
                console.log(`    Primary Keys: ${result.data.primary_keys.length}`);
                console.log(`    Foreign Keys: ${result.data.foreign_keys.length}`);
                console.log(`    Indexes: ${result.data.indexes.length}`);
                console.log(`    Constraints: ${result.data.constraints.length}`);
                // Verify structure matches Python implementation
                expect(result.data).toHaveProperty('columns');
                expect(result.data).toHaveProperty('primary_keys');
                expect(result.data).toHaveProperty('foreign_keys');
                expect(result.data).toHaveProperty('indexes');
                expect(result.data).toHaveProperty('constraints');
                expect(Array.isArray(result.data.columns)).toBe(true);
                expect(Array.isArray(result.data.primary_keys)).toBe(true);
                expect(Array.isArray(result.data.foreign_keys)).toBe(true);
                expect(Array.isArray(result.data.indexes)).toBe(true);
                expect(Array.isArray(result.data.constraints)).toBe(true);
            }
        });
    });
    describe(' Table Analysis - Complete Structure', () => {
        it('should analyze api.Idiomas table structure comprehensively', async () => {
            console.log(chalk.green('\n Analyzing table [api].[Idiomas]...'));
            const result = await mcp_table_analysis({ table_name: '[api].[Idiomas]' });
            expect(result.success).toBe(true);
            if (result.success) {
                const { columns, primary_keys, foreign_keys, indexes, constraints, table_info } = result.data;
                // Display table information
                if (table_info) {
                    console.log(chalk.yellow(`\n Table Information:`));
                    console.log(`   Schema: ${table_info.schema_name}`);
                    console.log(`   Table: ${table_info.table_name}`);
                    console.log(`   Created: ${table_info.create_date}`);
                    console.log(`   Modified: ${table_info.modify_date}`);
                    console.log(`   Row Count: ${table_info.row_count || 'N/A'}`);
                }
                // Display columns
                if (columns && columns.length > 0) {
                    const columnsTable = new Table({
                        head: [chalk.cyan('Column'), chalk.cyan('Type'), chalk.cyan('Nullable'), chalk.cyan('Identity'), chalk.cyan('Default')],
                        style: { head: [], border: [] }
                    });
                    columns.forEach((col) => {
                        const isPK = primary_keys.some((pk) => pk.column_name === col.column_name);
                        const columnName = isPK ? chalk.yellow(`${col.column_name} (PK)`) : col.column_name;
                        columnsTable.push([
                            columnName,
                            `${col.data_type}${col.max_length > 0 ? `(${col.max_length})` : ''}`,
                            col.is_nullable ? chalk.red('Yes') : chalk.green('No'),
                            col.is_identity ? chalk.blue('Yes') : 'No',
                            col.default_value || 'None'
                        ]);
                    });
                    console.log(chalk.green('\n Columns:'));
                    console.log(columnsTable.toString());
                }
                // Display foreign keys
                if (foreign_keys && foreign_keys.length > 0) {
                    const fkTable = new Table({
                        head: [chalk.cyan('FK Name'), chalk.cyan('Column'), chalk.cyan('References'), chalk.cyan('On Delete'), chalk.cyan('On Update')],
                        style: { head: [], border: [] }
                    });
                    foreign_keys.forEach((fk) => {
                        fkTable.push([
                            fk.foreign_key_name,
                            fk.parent_column,
                            `[${fk.referenced_schema}].[${fk.referenced_table}].[${fk.referenced_column}]`,
                            fk.delete_referential_action_desc,
                            fk.update_referential_action_desc
                        ]);
                    });
                    console.log(chalk.green('\n Foreign Keys:'));
                    console.log(fkTable.toString());
                }
                // Display indexes
                if (indexes && indexes.length > 0) {
                    const indexTable = new Table({
                        head: [chalk.cyan('Index Name'), chalk.cyan('Type'), chalk.cyan('Unique'), chalk.cyan('Primary'), chalk.cyan('Columns')],
                        style: { head: [], border: [] }
                    });
                    indexes.forEach((idx) => {
                        indexTable.push([
                            idx.index_name,
                            idx.index_type,
                            idx.is_unique ? chalk.blue('Yes') : 'No',
                            idx.is_primary_key ? chalk.yellow('Yes') : 'No',
                            idx.columns
                        ]);
                    });
                    console.log(chalk.green('\n Indexes:'));
                    console.log(indexTable.toString());
                }
                // Display constraints
                if (constraints && constraints.length > 0) {
                    const constraintTable = new Table({
                        head: [chalk.cyan('Constraint'), chalk.cyan('Type'), chalk.cyan('Column'), chalk.cyan('Definition')],
                        style: { head: [], border: [] }
                    });
                    constraints.forEach((constraint) => {
                        constraintTable.push([
                            constraint.constraint_name,
                            constraint.constraint_type,
                            constraint.column_name || 'N/A',
                            constraint.definition || 'N/A'
                        ]);
                    });
                    console.log(chalk.green('\n Constraints:'));
                    console.log(constraintTable.toString());
                }
                // Assertions
                expect(columns).toBeDefined();
                expect(Array.isArray(columns)).toBe(true);
                expect(Array.isArray(primary_keys)).toBe(true);
                expect(Array.isArray(foreign_keys)).toBe(true);
                expect(Array.isArray(indexes)).toBe(true);
                expect(Array.isArray(constraints)).toBe(true);
            }
        });
    });
    describe(' Data Preview & Statistics', () => {
        it('should preview data and show column statistics', async () => {
            console.log(chalk.green('\n Getting sample data from [api].[Idiomas]...'));
            const result = await mcp_preview_data({
                table_name: '[api].[Idiomas]',
                limit: 5
            });
            expect(result.success).toBe(true);
            if (result.success && result.data.length > 0) {
                // Display sample data
                const dataTable = new Table({
                    head: Object.keys(result.data[0]).map(key => chalk.cyan(key)),
                    style: { head: [], border: [] }
                });
                result.data.forEach((row) => {
                    dataTable.push(Object.values(row).map(val => val?.toString() || 'NULL'));
                });
                console.log(chalk.green('\n Sample Data (Top 5 rows):'));
                console.log(dataTable.toString());
                // Get column statistics for first few columns
                const columns = Object.keys(result.data[0]).slice(0, 3);
                console.log(chalk.green('\n Column Statistics:'));
                for (const column of columns) {
                    const statsResult = await mcp_get_column_stats({
                        table_name: '[api].[Idiomas]',
                        column_name: column
                    });
                    if (statsResult.success) {
                        console.log(chalk.yellow(`\n   ${column}:`));
                        console.log(`     Total rows: ${statsResult.data.total_rows}`);
                        console.log(`     Distinct values: ${statsResult.data.distinct_count}`);
                        console.log(`     Null count: ${statsResult.data.null_count}`);
                        if (statsResult.data.min_value && statsResult.data.max_value) {
                            console.log(`     Min value: ${statsResult.data.min_value}`);
                            console.log(`     Max value: ${statsResult.data.max_value}`);
                        }
                    }
                }
            }
        });
    });
    describe(' Database Object Dependencies', () => {
        it('should find dependencies for api.Idiomas', async () => {
            console.log(chalk.green('\n Searching dependencies for [api].[Idiomas]...'));
            const result = await mcp_get_dependencies({
                object_name: '[api].[Idiomas]'
            });
            expect(result.success).toBe(true);
            if (result.success) {
                if (result.data.length > 0) {
                    const depsTable = new Table({
                        head: [chalk.cyan('Referenced Schema'), chalk.cyan('Referenced Entity'), chalk.cyan('Database'), chalk.cyan('Server')],
                        style: { head: [], border: [] }
                    });
                    result.data.forEach((dep) => {
                        depsTable.push([
                            dep.referenced_schema_name || 'N/A',
                            dep.referenced_entity_name || 'N/A',
                            dep.referenced_database_name || 'N/A',
                            dep.referenced_server_name || 'N/A'
                        ]);
                    });
                    console.log(chalk.green('\n Dependencies found:'));
                    console.log(depsTable.toString());
                    // Show examples of fully qualified names
                    console.log(chalk.yellow('\n Examples of fully qualified object names:'));
                    result.data.forEach((dep) => {
                        if (dep.referenced_schema_name && dep.referenced_entity_name) {
                            console.log(`    [${dep.referenced_schema_name}].[${dep.referenced_entity_name}]`);
                        }
                    });
                }
                else {
                    console.log(chalk.yellow('   No dependencies found for [api].[Idiomas]'));
                }
                expect(Array.isArray(result.data)).toBe(true);
            }
        });
    });
    describe(' Stored Procedure Analysis', () => {
        const testSP = '[api].[usp_BusquedaByIdUnico_v2]';
        it('should analyze stored procedure structure', async () => {
            console.log(`\n Analyzing stored procedure ${testSP}...`);
            const result = await mcp_sp_structure({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('info');
                expect(result.data).toHaveProperty('parameters');
                expect(result.data).toHaveProperty('dependencies');
                expect(result.data).toHaveProperty('definition');
                expect(Array.isArray(result.data.parameters)).toBe(true);
                // Enhanced structure verification
                if (result.data.info) {
                    expect(result.data.info).toHaveProperty('schema_name');
                    expect(result.data.info).toHaveProperty('procedure_name');
                    expect(result.data.info).toHaveProperty('create_date');
                    expect(result.data.info).toHaveProperty('modify_date');
                }
                // Parameters table
                if (result.data.parameters.length > 0) {
                    console.log(chalk.blue('\n Enhanced Parameters:'));
                    const table = new Table({
                        head: ['Parameter', 'Type', 'Length', 'Output', 'Has Default', 'Default Value'],
                        style: { head: ['cyan'] }
                    });
                    result.data.parameters.forEach((param) => {
                        table.push([
                            param.parameter_name || 'N/A',
                            param.data_type || 'N/A',
                            param.max_length?.toString() || 'N/A',
                            param.is_output ? 'Yes' : 'No',
                            param.has_default_value ? 'Yes' : 'No',
                            param.default_value || 'None'
                        ]);
                    });
                    console.log(table.toString());
                }
                // Dependencies
                if (result.data.dependencies && result.data.dependencies.length > 0) {
                    console.log(chalk.blue('\n Dependencies:'));
                    const table = new Table({
                        head: ['Schema', 'Entity', 'Type', 'Database'],
                        style: { head: ['cyan'] }
                    });
                    result.data.dependencies.forEach((dep) => {
                        table.push([
                            dep.referenced_schema_name || 'N/A',
                            dep.referenced_entity_name || 'N/A',
                            dep.referenced_type || 'N/A',
                            dep.referenced_database_name || 'Current'
                        ]);
                    });
                    console.log(table.toString());
                }
                // Procedure definition (truncated for display)
                console.log(chalk.blue('\n Enhanced Procedure Definition:'));
                console.log(`${result.data.definition?.substring(0, 200)}...`);
            }
        });
        it('should get stored procedure basic info', async () => {
            console.log(`\n Getting SP info for ${testSP}...`);
            const result = await mcp_get_sp_info({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                console.log(chalk.blue('\n Stored Procedure Information:'));
                console.log(`   Schema: ${result.data.schema_name}`);
                console.log(`   Name: ${result.data.procedure_name}`);
                console.log(`   Created: ${result.data.create_date}`);
                console.log(`   Modified: ${result.data.modify_date}`);
                console.log(`   Type: ${result.data.type_desc}`);
                console.log(`   Definition Length: ${result.data.definition_length} characters`);
                console.log(`   Parameter Count: ${result.data.parameter_count}`);
                if (result.data.description) {
                    console.log(`   Description: ${result.data.description}`);
                }
                // Verify expected properties
                expect(result.data).toHaveProperty('schema_name');
                expect(result.data).toHaveProperty('procedure_name');
                expect(result.data).toHaveProperty('create_date');
                expect(result.data).toHaveProperty('modify_date');
                expect(result.data).toHaveProperty('type_desc');
                expect(result.data).toHaveProperty('definition_length');
                expect(result.data).toHaveProperty('parameter_count');
            }
        });
        it('should get detailed stored procedure parameters', async () => {
            console.log(`\n Getting SP parameters for ${testSP}...`);
            const result = await mcp_get_sp_parameters({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                if (result.data.length > 0) {
                    console.log(chalk.blue('\n Detailed Parameters Information:'));
                    const table = new Table({
                        head: ['Parameter', 'Data Type', 'Full Type', 'Max Length', 'Precision', 'Scale', 'Output', 'Has Default', 'Default Value'],
                        colWidths: [15, 12, 18, 12, 10, 8, 8, 12, 15],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((param) => {
                        table.push([
                            param.parameter_name || 'N/A',
                            param.data_type || 'N/A',
                            param.full_data_type || 'N/A',
                            param.max_length?.toString() || 'N/A',
                            param.precision?.toString() || 'N/A',
                            param.scale?.toString() || 'N/A',
                            param.is_output ? 'Yes' : 'No',
                            param.has_default_value ? 'Yes' : 'No',
                            param.default_value || 'None'
                        ]);
                    });
                    console.log(table.toString());
                    // Verify enhanced parameter structure
                    const firstParam = result.data[0];
                    expect(firstParam).toHaveProperty('parameter_name');
                    expect(firstParam).toHaveProperty('data_type');
                    expect(firstParam).toHaveProperty('full_data_type'); // Enhanced from Python version
                    expect(firstParam).toHaveProperty('is_output');
                    expect(firstParam).toHaveProperty('has_default_value');
                    expect(firstParam).toHaveProperty('default_value');
                }
            }
        });
        it('should get stored procedure dependencies', async () => {
            console.log(`\n Getting SP dependencies for ${testSP}...`);
            const result = await mcp_get_sp_dependencies({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                console.log(chalk.blue('\n Stored Procedure Dependencies:'));
                if (result.data.length > 0) {
                    const table = new Table({
                        head: ['Schema', 'Entity Name', 'Type', 'Class', 'Full Name', 'Database'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((dep) => {
                        table.push([
                            dep.referenced_schema_name || 'N/A',
                            dep.referenced_entity_name || 'N/A',
                            dep.referenced_type || 'N/A',
                            dep.referenced_class_desc || 'N/A',
                            dep.full_name || 'N/A',
                            dep.referenced_database_name || 'Current'
                        ]);
                    });
                    console.log(table.toString());
                    // Verify enhanced dependency structure
                    const firstDep = result.data[0];
                    expect(firstDep).toHaveProperty('referenced_schema_name');
                    expect(firstDep).toHaveProperty('referenced_entity_name');
                    expect(firstDep).toHaveProperty('referenced_type');
                    expect(firstDep).toHaveProperty('referenced_class_desc'); // Enhanced
                    expect(firstDep).toHaveProperty('full_name'); // Enhanced
                }
                else {
                    console.log(chalk.yellow('   No dependencies found'));
                }
            }
        });
        it('should get stored procedure definition', async () => {
            console.log(`\n Getting SP definition for ${testSP}...`);
            const result = await mcp_get_sp_definition({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                console.log(chalk.blue('\n Definition Information:'));
                console.log(`   Procedure: ${result.data.schema_name}.${result.data.procedure_name}`);
                console.log(`   Definition Length: ${result.data.definition_length} characters`);
                console.log(`   Created: ${result.data.create_date}`);
                console.log(`   Modified: ${result.data.modify_date}`);
                // Show first 300 characters of definition
                console.log(chalk.blue('\n Source Code Preview:'));
                console.log(`${result.data.source_code?.substring(0, 300)}...`);
                // Verify definition structure
                expect(result.data).toHaveProperty('procedure_name');
                expect(result.data).toHaveProperty('schema_name');
                expect(result.data).toHaveProperty('source_code');
                expect(result.data).toHaveProperty('definition_length');
                expect(result.data).toHaveProperty('create_date');
                expect(result.data).toHaveProperty('modify_date');
            }
        });
        it('should get complete stored procedure structure', async () => {
            console.log(`\n Getting COMPLETE SP structure for ${testSP}...`);
            const result = await mcp_get_sp_complete_structure({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.green('\n Complete SP Analysis Summary:'));
                console.log(`    Basic Info: ${result.data.info ? 'Available' : 'Not found'}`);
                console.log(`    Parameters: ${result.data.parameters.length}`);
                console.log(`    Dependencies: ${result.data.dependencies.length}`);
                console.log(`    Definition: ${result.data.definition ? 'Available' : 'Not found'}`);
                // Verify structure matches Python implementation
                expect(result.data).toHaveProperty('info');
                expect(result.data).toHaveProperty('parameters');
                expect(result.data).toHaveProperty('dependencies');
                expect(result.data).toHaveProperty('definition');
                expect(Array.isArray(result.data.parameters)).toBe(true);
                expect(Array.isArray(result.data.dependencies)).toBe(true);
                // Show summary table
                if (result.data.info) {
                    console.log(chalk.blue('\n SP Summary:'));
                    const summaryTable = new Table({
                        head: ['Property', 'Value'],
                        style: { head: ['cyan'] }
                    });
                    summaryTable.push(['Schema', result.data.info.schema_name || 'N/A'], ['Name', result.data.info.procedure_name || 'N/A'], ['Type', result.data.info.type_desc || 'N/A'], ['Parameters', result.data.parameters.length.toString()], ['Dependencies', result.data.dependencies.length.toString()], ['Definition Length', result.data.info.definition_length?.toString() || 'N/A'], ['Created', result.data.info.create_date || 'N/A'], ['Modified', result.data.info.modify_date || 'N/A']);
                    console.log(summaryTable.toString());
                }
            }
        });
    });
    describe(' SQL Query Execution', () => {
        it('should execute custom SQL queries', async () => {
            console.log(chalk.green('\n Executing custom SQL query...'));
            const result = await mcp_execute_query({
                query: 'SELECT TOP 3 TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\' ORDER BY TABLE_NAME'
            });
            expect(result.success).toBe(true);
            if (result.success && result.data.length > 0) {
                const queryTable = new Table({
                    head: Object.keys(result.data[0]).map(key => chalk.cyan(key)),
                    style: { head: [], border: [] }
                });
                result.data.forEach((row) => {
                    queryTable.push(Object.values(row).map(val => val?.toString() || 'NULL'));
                });
                console.log(chalk.green('\n Query Results:'));
                console.log(queryTable.toString());
            }
        });
        it('should handle invalid SQL gracefully', async () => {
            const result = await mcp_execute_query({
                query: 'INVALID SQL QUERY'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                console.log(chalk.red(`    Expected error: ${result.error}`));
                expect(result.error).toBeDefined();
            }
        });
    });
    describe(' Stored Procedure Info - Simple Functions (Python StoredProcedureInfo Style)', () => {
        const testSP = '[api].[usp_BusquedaByIdUnico_v2]';
        it('should get stored procedure definition (simple)', async () => {
            console.log(`\n Getting SP definition (simple) for ${testSP}...`);
            const result = await mcp_get_sp_definition_simple({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success && result.data) {
                console.log(chalk.blue('\n Simple Definition Result:'));
                console.log(`   Definition Length: ${result.data.length} characters`);
                console.log(`   Preview: ${result.data.substring(0, 150)}...`);
                // Verify it's a string
                expect(typeof result.data).toBe('string');
                expect(result.data.length).toBeGreaterThan(0);
            }
        });
        it('should get stored procedure parameters (simple)', async () => {
            console.log(`\n Getting SP parameters (simple) for ${testSP}...`);
            const result = await mcp_get_sp_parameters_simple({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                if (result.data.length > 0) {
                    console.log(chalk.blue('\n Simple Parameters Information:'));
                    const table = new Table({
                        head: ['Parameter', 'Data Type', 'Max Length', 'Output', 'Has Default', 'Default Value'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((param) => {
                        table.push([
                            param.parameter_name || 'N/A',
                            param.data_type || 'N/A',
                            param.max_length?.toString() || 'N/A',
                            param.is_output ? 'Yes' : 'No',
                            param.has_default_value ? 'Yes' : 'No',
                            param.default_value || 'None'
                        ]);
                    });
                    console.log(table.toString());
                    // Verify parameter structure
                    const firstParam = result.data[0];
                    expect(firstParam).toHaveProperty('parameter_name');
                    expect(firstParam).toHaveProperty('data_type');
                    expect(firstParam).toHaveProperty('is_output');
                    expect(firstParam).toHaveProperty('has_default_value');
                }
            }
        });
        it('should get stored procedure dependencies (simple)', async () => {
            console.log(`\n Getting SP dependencies (simple) for ${testSP}...`);
            const result = await mcp_get_sp_dependencies_simple({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                console.log(chalk.blue('\n Simple Dependencies Information:'));
                if (result.data.length > 0) {
                    const table = new Table({
                        head: ['Referencing Object', 'Referenced Object', 'Referenced Schema', 'Referenced Type', 'Level'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((dep) => {
                        table.push([
                            dep.referencing_object || 'N/A',
                            dep.referenced_object || 'N/A',
                            dep.referenced_schema || 'N/A',
                            dep.referenced_type || 'N/A',
                            dep.level?.toString() || 'N/A'
                        ]);
                    });
                    console.log(table.toString());
                    // Verify dependency structure
                    const firstDep = result.data[0];
                    expect(firstDep).toHaveProperty('referencing_object');
                    expect(firstDep).toHaveProperty('referenced_object');
                    expect(firstDep).toHaveProperty('referenced_schema');
                    expect(firstDep).toHaveProperty('referenced_type');
                    expect(firstDep).toHaveProperty('level');
                }
                else {
                    console.log(chalk.yellow('   No dependencies found'));
                }
            }
        });
        it('should get all stored procedure info (simple - matching Python get_all_info)', async () => {
            console.log(`\n Getting ALL SP info (simple) for ${testSP}...`);
            const result = await mcp_get_sp_all_info_simple({ sp_name: testSP });
            expect(result.success).toBe(true);
            if (result.success) {
                console.log(chalk.green('\n Simple SP Info Summary (Python Style):'));
                console.log(`    Definition: ${result.data.definition ? 'Available' : 'Not found'}`);
                console.log(`    Parameters: ${result.data.parameters.length}`);
                console.log(`    Dependencies: ${result.data.dependencies.length}`);
                // Verify structure matches Python get_all_info method
                expect(result.data).toHaveProperty('definition');
                expect(result.data).toHaveProperty('parameters');
                expect(result.data).toHaveProperty('dependencies');
                expect(Array.isArray(result.data.parameters)).toBe(true);
                expect(Array.isArray(result.data.dependencies)).toBe(true);
                // Show summary table
                console.log(chalk.blue('\n Simple SP Info Summary:'));
                const summaryTable = new Table({
                    head: ['Property', 'Value'],
                    style: { head: ['cyan'] }
                });
                summaryTable.push(['Definition Available', result.data.definition ? 'Yes' : 'No'], ['Definition Length', result.data.definition ? result.data.definition.length.toString() : '0'], ['Parameters Count', result.data.parameters.length.toString()], ['Dependencies Count', result.data.dependencies.length.toString()]);
                console.log(summaryTable.toString());
                // Show definition preview if available
                if (result.data.definition) {
                    console.log(chalk.blue('\n Definition Preview:'));
                    console.log(`${result.data.definition.substring(0, 200)}...`);
                }
            }
        });
    });
    // ObjectSearch class tests - matching Python ObjectSearch functionality (VERY IMPORTANT)
    describe(' ObjectSearch Functions - Database Object Discovery', () => {
        describe(' Search by Name', () => {
            test(' mcp_search_objects_by_name - should find objects by name pattern', async () => {
                console.log(chalk.cyan('\n Testing Object Search by Name'));
                const result = await mcp_search_objects_by_name({
                    pattern: 'Idiomas'
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                if (result.success && result.data && result.data.length > 0) {
                    const table = new Table({
                        head: ['Object Name', 'Type', 'Schema', 'Created', 'Modified'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((obj) => {
                        table.push([
                            chalk.yellow(obj.object_name),
                            chalk.blue(obj.object_type),
                            chalk.green(obj.schema_name || 'dbo'),
                            chalk.gray(obj.create_date ? new Date(obj.create_date).toLocaleDateString() : 'N/A'),
                            chalk.gray(obj.modify_date ? new Date(obj.modify_date).toLocaleDateString() : 'N/A')
                        ]);
                    });
                    console.log(chalk.green(' Objects Found by Name Pattern:'));
                    console.log(table.toString());
                    console.log(chalk.blue(` Total objects found: ${result.data.length}`));
                }
            });
            test(' mcp_search_objects_by_name - should filter by object types', async () => {
                console.log(chalk.cyan('\n Testing Object Search with Type Filter'));
                const result = await mcp_search_objects_by_name({
                    pattern: 'usp_',
                    object_types: ['P'] // Only procedures
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                console.log(chalk.green(' Procedures Found:'));
                console.log(chalk.blue(` Stored procedures matching 'usp_': ${result.success ? result.data?.length || 0 : 0}`));
            });
        });
        describe(' Search in Definitions', () => {
            test(' mcp_search_in_definitions - should find objects by content', async () => {
                console.log(chalk.cyan('\n Testing Search in Definitions'));
                const result = await mcp_search_in_definitions({
                    pattern: 'SELECT',
                    object_types: ['P'] // Only procedures
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                if (result.success && result.data && result.data.length > 0) {
                    const table = new Table({
                        head: ['Object Name', 'Type', 'Schema', 'Definition Preview'],
                        colWidths: [25, 15, 10, 40],
                        style: { head: ['cyan'] }
                    });
                    result.data.slice(0, 5).forEach((obj) => {
                        table.push([
                            chalk.yellow(obj.object_name),
                            chalk.blue(obj.object_type),
                            chalk.green(obj.schema_name || 'dbo'),
                            chalk.white((obj.definition_preview || '').substring(0, 35) + '...')
                        ]);
                    });
                    console.log(chalk.green(' Objects Found by Definition Content:'));
                    console.log(table.toString());
                    console.log(chalk.blue(` Total objects with 'SELECT': ${result.data.length}`));
                }
            });
        });
        describe(' Search by Type', () => {
            test(' mcp_search_objects_by_type - should find all objects of specific type', async () => {
                console.log(chalk.cyan('\n Testing Search by Object Type'));
                const result = await mcp_search_objects_by_type({
                    object_type: 'TABLE'
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                if (result.success && result.data && result.data.length > 0) {
                    const table = new Table({
                        head: ['Table Name', 'Schema', 'Created', 'Modified'],
                        style: { head: ['cyan'] }
                    });
                    result.data.slice(0, 10).forEach((obj) => {
                        table.push([
                            chalk.yellow(obj.object_name),
                            chalk.green(obj.schema_name || 'dbo'),
                            chalk.gray(obj.create_date ? new Date(obj.create_date).toLocaleDateString() : 'N/A'),
                            chalk.gray(obj.modify_date ? new Date(obj.modify_date).toLocaleDateString() : 'N/A')
                        ]);
                    });
                    console.log(chalk.green(' Tables Found:'));
                    console.log(table.toString());
                    console.log(chalk.blue(` Total tables in database: ${result.data.length}`));
                }
            });
            test(' mcp_search_objects_by_type - should handle invalid type', async () => {
                console.log(chalk.cyan('\n Testing Invalid Object Type'));
                const result = await mcp_search_objects_by_type({
                    object_type: 'INVALID'
                });
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toContain('Invalid object type');
                    console.log(chalk.red(` Expected error: ${result.error}`));
                }
            });
        });
        describe(' Object Dependencies', () => {
            test(' mcp_get_object_dependencies - should find object dependencies', async () => {
                console.log(chalk.cyan('\n Testing Object Dependencies'));
                const result = await mcp_get_object_dependencies({
                    object_name: '[api].[usp_BusquedaByIdUnico_v2]'
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                if (result.success && result.data && result.data.length > 0) {
                    const table = new Table({
                        head: ['Referencing Object', 'Referenced Object', 'Type', 'Dependency Type'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((dep) => {
                        table.push([
                            chalk.yellow(`${dep.referencing_schema}.${dep.referencing_object}`),
                            chalk.blue(`${dep.referenced_schema}.${dep.referenced_object}`),
                            chalk.green(dep.object_type),
                            dep.dependency_type === 'Dependent' ? chalk.red(' Dependent') : chalk.cyan(' Dependency')
                        ]);
                    });
                    console.log(chalk.green(' Object Dependencies Found:'));
                    console.log(table.toString());
                    console.log(chalk.blue(` Total dependencies: ${result.data.length}`));
                }
                else {
                    console.log(chalk.yellow(' No dependencies found for this object'));
                }
            });
        });
        describe(' Comprehensive Search', () => {
            test(' mcp_search_comprehensive - should perform complete search', async () => {
                console.log(chalk.cyan('\n Testing Comprehensive Search'));
                const result = await mcp_search_comprehensive({
                    pattern: 'Id',
                    search_in_names: true,
                    search_in_definitions: true,
                    object_types: ['U', 'P'] // Tables and procedures
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toHaveProperty('name_matches');
                    expect(result.data).toHaveProperty('definition_matches');
                    expect(result.data).toHaveProperty('total_matches');
                }
                if (result.success && result.data) {
                    const summaryTable = new Table({
                        head: ['Search Type', 'Matches Found'],
                        style: { head: ['cyan'] }
                    });
                    summaryTable.push([' Name Matches', chalk.green(result.data.name_matches.length.toString())], [' Definition Matches', chalk.yellow(result.data.definition_matches.length.toString())], [' Total Matches', chalk.blue(result.data.total_matches.toString())]);
                    console.log(chalk.green(' Comprehensive Search Results:'));
                    console.log(summaryTable.toString());
                    if (result.data.name_matches.length > 0) {
                        console.log(chalk.cyan('\n Sample Name Matches:'));
                        const nameTable = new Table({
                            head: ['Object Name', 'Type', 'Schema'],
                            style: { head: ['cyan'] }
                        });
                        result.data.name_matches.slice(0, 3).forEach((obj) => {
                            nameTable.push([
                                chalk.yellow(obj.object_name),
                                chalk.blue(obj.object_type),
                                chalk.green(obj.schema_name || 'dbo')
                            ]);
                        });
                        console.log(nameTable.toString());
                    }
                    if (result.data.definition_matches.length > 0) {
                        console.log(chalk.cyan('\n Sample Definition Matches:'));
                        console.log(chalk.white(`Found pattern 'Id' in ${result.data.definition_matches.length} object definitions`));
                    }
                }
            });
        });
    });
    // QuickView class tests - matching Python QuickView functionality
    describe(' QuickView Functions', () => {
        describe(' Enhanced Data Preview', () => {
            test(' mcp_preview_data_enhanced - should preview table data with formatting', async () => {
                console.log(chalk.cyan('\n Testing Enhanced Data Preview'));
                const result = await mcp_preview_data_enhanced({
                    table_name: '[api].[Idiomas]',
                    limit: 5
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                if (result.success && result.data && result.data.length > 0) {
                    const table = new Table({
                        head: ['Field', 'Sample Value', 'Type'],
                        style: { head: ['cyan'] }
                    });
                    const firstRow = result.data[0];
                    Object.entries(firstRow).forEach(([key, value]) => {
                        table.push([
                            chalk.yellow(key),
                            chalk.white(String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')),
                            chalk.gray(typeof value)
                        ]);
                    });
                    console.log(chalk.green(' Enhanced Preview Results:'));
                    console.log(table.toString());
                    console.log(chalk.blue(` Total rows returned: ${result.data.length}`));
                }
            });
            test(' mcp_preview_data_enhanced - should handle filters', async () => {
                console.log(chalk.cyan('\n Testing Enhanced Data Preview with Filters'));
                const result = await mcp_preview_data_enhanced({
                    table_name: '[api].[Idiomas]',
                    filters: { 'Id': 1 },
                    limit: 3
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                console.log(chalk.green(' Filtered Preview Results:'));
                console.log(chalk.blue(` Rows with Id=1: ${result.success ? result.data?.length || 0 : 0}`));
            });
        });
        describe(' Sample Values', () => {
            test(' mcp_get_sample_values - should get distinct sample values', async () => {
                console.log(chalk.cyan('\n Testing Sample Values'));
                const result = await mcp_get_sample_values({
                    table_name: '[api].[Idiomas]',
                    column_name: 'Description',
                    limit: 5
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(Array.isArray(result.data)).toBe(true);
                }
                if (result.success && result.data && result.data.length > 0) {
                    const table = new Table({
                        head: ['Sample Values'],
                        style: { head: ['cyan'] }
                    });
                    result.data.forEach((value) => {
                        table.push([chalk.yellow(String(value))]);
                    });
                    console.log(chalk.green(' Sample Values Results:'));
                    console.log(table.toString());
                }
            });
        });
        describe(' Enhanced Column Statistics', () => {
            test(' mcp_get_column_stats_enhanced - should get comprehensive column stats', async () => {
                console.log(chalk.cyan('\n Testing Enhanced Column Statistics'));
                const result = await mcp_get_column_stats_enhanced({
                    table_name: '[api].[Idiomas]',
                    column_name: 'Description'
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toHaveProperty('total_rows');
                    expect(result.data).toHaveProperty('distinct_values');
                    expect(result.data).toHaveProperty('null_count');
                    expect(result.data).toHaveProperty('sample_values');
                }
                if (result.success && result.data) {
                    const table = new Table({
                        head: ['Statistic', 'Value'],
                        style: { head: ['cyan'] }
                    });
                    table.push([' Total Rows', chalk.green(result.data.total_rows.toString())], [' Distinct Values', chalk.yellow(result.data.distinct_values.toString())], [' Null Count', chalk.red(result.data.null_count.toString())], [' Min Value', chalk.blue(String(result.data.min_value || 'N/A'))], [' Max Value', chalk.blue(String(result.data.max_value || 'N/A'))], [' Sample Count', chalk.magenta(result.data.sample_values.length.toString())]);
                    console.log(chalk.green(' Enhanced Column Statistics:'));
                    console.log(table.toString());
                    if (result.data.sample_values.length > 0) {
                        console.log(chalk.cyan(' Sample Values:'));
                        console.log(chalk.white(result.data.sample_values.join(', ')));
                    }
                }
            });
        });
        describe(' Quick Data Analysis', () => {
            test(' mcp_quick_data_analysis - should perform comprehensive analysis', async () => {
                console.log(chalk.cyan('\n Testing Quick Data Analysis'));
                const result = await mcp_quick_data_analysis({
                    table_name: '[api].[Idiomas]',
                    limit: 3
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toHaveProperty('preview_data');
                    expect(result.data).toHaveProperty('column_count');
                    expect(result.data).toHaveProperty('row_count');
                    expect(result.data).toHaveProperty('columns_info');
                }
                if (result.success && result.data) {
                    const summaryTable = new Table({
                        head: ['Metric', 'Value'],
                        style: { head: ['cyan'] }
                    });
                    summaryTable.push([' Total Rows', chalk.green(result.data.row_count.toString())], [' Column Count', chalk.yellow(result.data.column_count.toString())], [' Preview Rows', chalk.blue(result.data.preview_data.length.toString())]);
                    console.log(chalk.green(' Quick Analysis Summary:'));
                    console.log(summaryTable.toString());
                    if (result.data.columns_info.length > 0) {
                        const columnsTable = new Table({
                            head: ['Column', 'Type', 'Max Length', 'Nullable', 'Identity'],
                            style: { head: ['cyan'] }
                        });
                        result.data.columns_info.forEach((col) => {
                            columnsTable.push([
                                chalk.yellow(col.column_name),
                                chalk.blue(col.data_type),
                                chalk.gray(col.max_length?.toString() || 'N/A'),
                                col.is_nullable ? chalk.green('') : chalk.red(''),
                                col.is_identity ? chalk.green('') : chalk.gray('')
                            ]);
                        });
                        console.log(chalk.cyan('\n Column Information:'));
                        console.log(columnsTable.toString());
                    }
                    if (result.data.preview_data.length > 0) {
                        console.log(chalk.cyan('\n Preview Data:'));
                        const previewTable = new Table({
                            head: Object.keys(result.data.preview_data[0]).map(key => chalk.cyan(key)),
                            style: { head: ['cyan'] }
                        });
                        result.data.preview_data.forEach((row) => {
                            previewTable.push(Object.values(row).map((value) => chalk.white(String(value).substring(0, 20) + (String(value).length > 20 ? '...' : ''))));
                        });
                        console.log(previewTable.toString());
                    }
                }
            });
        });
    });
    describe(' Stored Procedure Execution', () => {
        test(' mcp_execute_procedure - should execute stored procedure', async () => {
            console.log(chalk.cyan('\n Testing Stored Procedure Execution'));
            // First, let's find a simple stored procedure to test with
            const spSearchResult = await mcp_search_objects_by_type({
                object_type: 'procedure'
            });
            expect(spSearchResult.success).toBe(true);
            if (spSearchResult.success && spSearchResult.data && spSearchResult.data.length > 0) {
                // Try to find a simple procedure without parameters
                const simpleProcedures = spSearchResult.data.filter((sp) => sp.object_name &&
                    (sp.object_name.includes('list') || sp.object_name.includes('get') || sp.object_name.includes('select')));
                if (simpleProcedures.length > 0) {
                    const testProcedure = simpleProcedures[0];
                    const procedureName = `[${testProcedure.schema_name}].[${testProcedure.object_name}]`;
                    console.log(chalk.blue(` Testing procedure: ${procedureName}`));
                    // First get the procedure structure to understand parameters
                    const spStructure = await mcp_sp_structure({ sp_name: procedureName });
                    if (spStructure.success && spStructure.data) {
                        console.log(chalk.yellow(` Parameters found: ${spStructure.data.parameters?.length || 0}`));
                        // Try to execute with minimal parameters
                        const executeResult = await mcp_execute_procedure({
                            sp_name: procedureName,
                            params: {} // Start with no parameters
                        });
                        // The result might succeed or fail depending on required parameters
                        expect(executeResult).toHaveProperty('success');
                        if (executeResult.success) {
                            console.log(chalk.green(' Procedure executed successfully!'));
                            if (executeResult.data && Array.isArray(executeResult.data) && executeResult.data.length > 0) {
                                const resultTable = new Table({
                                    head: ['Result Type', 'Count', 'Sample'],
                                    style: { head: ['cyan'] }
                                });
                                resultTable.push([
                                    chalk.yellow('Rows Returned'),
                                    chalk.green(executeResult.data.length.toString()),
                                    chalk.blue(executeResult.data.length > 0 ?
                                        Object.keys(executeResult.data[0]).join(', ').substring(0, 30) + '...' :
                                        'No data')
                                ]);
                                console.log(resultTable.toString());
                            }
                            else {
                                console.log(chalk.blue(' Procedure executed but returned no data'));
                            }
                        }
                        else {
                            console.log(chalk.yellow(' Procedure execution failed (expected for procedures requiring parameters)'));
                            if (!executeResult.success) {
                                console.log(chalk.gray(`Error: ${executeResult.error}`));
                                expect(executeResult.error).toBeDefined();
                            }
                        }
                    }
                }
                else {
                    console.log(chalk.yellow(' No suitable test procedures found, testing with a known procedure pattern'));
                    // Test the function structure even if we can't execute a real procedure
                    const testResult = await mcp_execute_procedure({
                        sp_name: '[dbo].[NonExistentProcedure]',
                        params: {}
                    });
                    expect(testResult).toHaveProperty('success');
                    expect(testResult.success).toBe(false);
                    if (!testResult.success) {
                        expect(testResult.error).toBeDefined();
                    }
                    console.log(chalk.green(' Function structure validation passed'));
                }
            }
            else {
                console.log(chalk.yellow(' Could not find procedures to test with'));
                // Still test the function exists and has proper structure
                const testResult = await mcp_execute_procedure({
                    sp_name: '[dbo].[TestProcedure]',
                    params: {}
                });
                expect(testResult).toHaveProperty('success');
                expect(testResult).toHaveProperty('error');
                console.log(chalk.green(' Function interface validation passed'));
            }
        });
        test(' mcp_execute_procedure - should handle parameters correctly', async () => {
            console.log(chalk.cyan('\n Testing Stored Procedure with Parameters'));
            // Test parameter handling with a non-existent procedure
            const result = await mcp_execute_procedure({
                sp_name: '[dbo].[TestProcedureWithParams]',
                params: {
                    param1: 'test_value',
                    param2: 123,
                    param3: true,
                    param4: null
                }
            });
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('error');
            // Should fail because procedure doesn't exist, but parameters should be handled
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('Could not find stored procedure');
                console.log(chalk.gray(`Expected error: ${result.error}`));
            }
            console.log(chalk.green(' Parameter handling validation passed'));
        });
    });
});
