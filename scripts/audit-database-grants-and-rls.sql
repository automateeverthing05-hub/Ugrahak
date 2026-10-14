-- ==============================================================================
-- READ-ONLY SQL Script: Database Role Grants, Permissions, & RLS Audit
-- NOTE: READ-ONLY query script. DO NOT run against live database unless auditing.
-- ==============================================================================

-- 1. Table-level Privileges for anon and authenticated roles
SELECT 
    grantee, 
    table_schema, 
    table_name, 
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as granted_privileges
FROM information_schema.role_table_grants 
WHERE grantee IN ('anon', 'authenticated', 'public')
  AND table_schema = 'public'
GROUP BY grantee, table_schema, table_name
ORDER BY table_name, grantee;

-- 2. Column-level Privileges for anon and authenticated roles
SELECT 
    grantee, 
    table_name, 
    column_name, 
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.column_privileges
WHERE grantee IN ('anon', 'authenticated', 'public')
  AND table_schema = 'public'
GROUP BY grantee, table_name, column_name
ORDER BY table_name, column_name, grantee;

-- 3. Row Level Security (RLS) Status & Policies on All Public Tables
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd as operation, 
    qual as using_expression, 
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Function Execution Privileges for anon and authenticated
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    r.rolname as granted_role
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND r.rolname IN ('anon', 'authenticated', 'public')
  AND has_function_privilege(r.rolname, p.oid, 'EXECUTE')
ORDER BY p.proname, r.rolname;

