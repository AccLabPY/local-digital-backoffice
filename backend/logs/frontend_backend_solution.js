// Solución para el problema de CAPITAL en frontend/backend

/**
 * PROBLEMA IDENTIFICADO:
 * ------------------
 * Hay empresas que tienen distrito = "ASUNCIÓN" pero no tienen departamento asignado.
 * También hay empresas sin departamento ni distrito que deberían considerarse de CAPITAL.
 * 
 * SOLUCIÓN BACKEND:
 * ---------------
 * En el modelo empresa.model.js, modificar la consulta para tratar correctamente los casos especiales:
 */

// Modificación sugerida para empresa.model.js en la función buildWhereClause():

// 1. Modificación para el filtro de departamento CAPITAL
if (filters.departamento && Array.isArray(filters.departamento) && filters.departamento.length > 0) {
  // Separar "Capital" de los departamentos normales
  const departamentosNormales = filters.departamento.filter(d => d !== 'Capital');
  const incluirCapital = filters.departamento.includes('Capital');
  
  if (departamentosNormales.length > 0) {
    const depParams = addInCondition('Nombre', departamentosNormales, 'dbo.Departamentos', 'dep', 'IdDepartamento');
    allParams = [...allParams, ...depParams];
  }
  
  if (incluirCapital) {
    // Condición modificada para CAPITAL que incluye:
    // 1. Distrito = "ASUNCIÓN"
    // 2. O (departamento = 0 que corresponde a CAPITAL)
    conditions.push(`(
      EXISTS (SELECT 1 FROM dbo.SubRegion sr_cap 
        WHERE sr_cap.IdSubRegion = ei.IdLocalidad 
        AND sr_cap.Nombre = 'ASUNCIÓN')
      OR ei.IdDepartamento = 0
    )`);
  }
}

// 2. Modificación en la consulta SQL principal para modificar la selección de departamento
// En la sección SELECT de la consulta, cambiar:

CASE 
  WHEN sr.Nombre = 'ASUNCIÓN' THEN 'Capital'
  WHEN dep.Nombre IS NOT NULL THEN dep.Nombre 
  ELSE 'Sin departamento' 
END AS departamento

/**
 * SOLUCIÓN FRONTEND:
 * ----------------
 * En el componente de filtro, asegurarse de que el departamento "Capital" se maneje correctamente:
 */

// En el componente FilterPanel.tsx o similar
const handleDepartmentChange = (value) => {
  // Si se selecciona Capital, asegurarse de que se envíe correctamente al backend
  setSelectedDepartment(value);
  
  // Si es necesario, actualizar también los distritos disponibles
  if (value.includes('Capital')) {
    // Cargar los distritos de Capital (principalmente "ASUNCIÓN")
    // ...
  }
};
