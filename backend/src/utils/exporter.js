const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const config = require('../config/config');

/**
 * Utility class for exporting data to different formats
 */
class Exporter {

    /**
   * Export ficha completa de empresa to PDF
   * @param {Object} fichaData - Complete company ficha data (empresa, historial, totalChequeos)
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
    static async exportEmpresaFichaToPDF(fichaData, fileName) {
      try {
        const exportDir = path.join(config.logging.directory, 'exports');
        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }
        
        const filePath = path.join(exportDir, `${fileName}_${Date.now()}.pdf`);
        const doc = new PDFDocument({ 
          margin: 40, 
          size: 'A4',
          bufferPages: true
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);
        
        // Colors - Corporate palette
        const primaryBlue = '#150773';
        const primaryOrange = '#f5592b';
        const lightGray = '#f5f5f5';
        const darkGray = '#666666';
        const white = '#FFFFFF';
        
        const { empresa, historial, totalChequeos } = fichaData;
        
        // Helper function: Format date
        const formatDate = (dateStr) => {
          if (!dateStr) return 'N/A';
          const date = new Date(dateStr);
          return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        };
        
        // Helper function: Draw header with logos on RIGHT
        const drawHeader = () => {
          // Header background
          doc.rect(0, 0, doc.page.width, 80).fill(primaryBlue);
          
          // Decorative orange accent
          doc.rect(0, 75, doc.page.width, 5).fill(primaryOrange);
          
          // Title - LEFT ALIGNED
          doc.fillColor(white)
             .fontSize(22)
             .font('Helvetica-Bold')
             .text('FICHA DE EMPRESA', 40, 20, { align: 'left' });
          
          doc.fontSize(11)
             .font('Helvetica')
             .text('Chequeo Digital - Programa de Innovacion', 40, 48, { align: 'left' });
          
          // Generation date - SMALLER font
          const fechaGeneracion = new Date().toLocaleString('es-ES', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
          doc.fontSize(8)
             .font('Helvetica')
             .text(`Generado: ${fechaGeneracion}`, 40, 62, { align: 'left' });
          
          // Logos on the RIGHT (MIC primero, BID segundo)
          const logoMICPath = path.join(__dirname, '../../../public/logoMIC.png');
          const logoBIDPath = path.join(__dirname, '../../../public/logoBID.png');
          
          try {
            if (fs.existsSync(logoMICPath)) {
              doc.image(logoMICPath, doc.page.width - 180, 15, { width: 70, height: 70, fit: [70, 70] });
            } else {
              logger.warn(`MIC logo not found at: ${logoMICPath}`);
            }
          } catch (e) {
            logger.warn(`Could not load MIC logo: ${e.message}`);
          }
          
          try {
            if (fs.existsSync(logoBIDPath)) {
              doc.image(logoBIDPath, doc.page.width - 100, 15, { width: 70, height: 70, fit: [70, 70] });
            } else {
              logger.warn(`BID logo not found at: ${logoBIDPath}`);
            }
          } catch (e) {
            logger.warn(`Could not load BID logo: ${e.message}`);
          }
        };
        
        // Helper function: Draw section header
        const drawSectionHeader = (title) => {
          doc.fillColor(primaryBlue)
             .fontSize(14)
             .font('Helvetica-Bold')
             .text(title, 40, doc.y);
          
          // Underline with orange accent
          doc.moveTo(40, doc.y + 2)
             .lineTo(doc.page.width - 40, doc.y + 2)
             .lineWidth(2)
             .strokeColor(primaryOrange)
             .stroke();
          
          doc.y += 15;
        };
        
        // Helper function: Draw info row
        const drawInfoRow = (label, value, y) => {
          doc.fillColor(darkGray)
             .fontSize(9)
             .font('Helvetica-Bold')
             .text(label, 40, y, { width: 150 });
          
          doc.fillColor('#000000')
             .fontSize(9)
             .font('Helvetica')
             .text(value || 'N/A', 200, y, { width: doc.page.width - 240 });
        };
        
        // === PAGE 1: INFORMACIÓN GENERAL ===
        drawHeader();
        doc.y = 100;
        
        // Nombre de la empresa - Formato "Nombre: [empresa]"
        const nombreLabel = 'Nombre: ';
        const nombreEmpresa = empresa.empresa || 'N/A';
        
        // Label "Nombre:" en azul
        doc.fillColor(primaryBlue)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(nombreLabel, 40, doc.y, { continued: true });
        
        // Nombre de la empresa en naranja
        doc.fillColor(primaryOrange)
           .text(nombreEmpresa, { width: doc.page.width - 120 });
        
        doc.y += 30;
        
        drawSectionHeader('INFORMACION GENERAL');
        
        let currentY = doc.y;
        const baseRowHeight = 20;
        const minRowHeight = 25; // Altura mínima para textos largos
        const maxValueWidth = doc.page.width - 250;
        
        // Información básica con diseño mejorado
        const infoData = [
          { label: 'RUC:', value: empresa.ruc },
          { label: 'Sector:', value: empresa.sectorActividadDescripcion },
          { label: 'Sub-Sector:', value: empresa.subSectorActividadDescripcion },
          { label: 'Ubicacion:', value: `${empresa.departamento || ''} - ${empresa.distrito || ''}` },
          { label: 'Ano Creacion:', value: empresa.anioCreacion },
          { label: 'Total Empleados:', value: empresa.TotalEmpleados },
          { label: 'Ventas Anuales:', value: empresa.ventasAnuales },
          { label: 'Encuestado:', value: empresa.nombreEncuestado },
          { label: 'Correo:', value: empresa.emailEncuestado },
          { label: 'Genero Gerente:', value: empresa.SexoGerenteGeneral },
          { label: 'Genero Propietario:', value: empresa.SexoPropietarioPrincipal }
        ];
        
        // Dibujar información en formato de tabla mejorado con altura dinámica
        infoData.forEach((item, index) => {
          const bgColor = index % 2 === 0 ? '#f8f9fa' : white;
          const valueText = item.value || 'N/A';
          
          // Calcular altura necesaria para el texto del value
          doc.fontSize(9).font('Helvetica');
          const textHeight = doc.heightOfString(valueText, { width: maxValueWidth });
          
          // Determinar altura de fila (mínimo 25pts, o basado en el texto + padding)
          const rowHeight = Math.max(minRowHeight, textHeight + 12);
          
          // Fondo de fila
          doc.rect(40, currentY - 2, doc.page.width - 80, rowHeight)
             .fill(bgColor);
          
          // Label
          doc.fillColor(primaryBlue)
             .fontSize(9)
             .font('Helvetica-Bold')
             .text(item.label, 50, currentY + 6, { width: 140 });
          
          // Value
          doc.fillColor('#000000')
             .fontSize(9)
             .font('Helvetica')
             .text(valueText, 200, currentY + 6, { width: maxValueWidth });
          
          currentY += rowHeight;
        });
        
        doc.y = currentY + 15;
        
        // === RESUMEN DE EVALUACIÓN ACTUAL ===
        drawSectionHeader('EVALUACION ACTUAL');
        
        currentY = doc.y;
        
        // Card de Nivel de Madurez - Mejorado con gradiente simulado
        const cardHeight = 65;
        
        // Fondo principal
        doc.rect(40, currentY, doc.page.width - 80, cardHeight)
           .fillAndStroke(lightGray, primaryBlue);
        
        // Acento lateral izquierdo
        doc.rect(40, currentY, 5, cardHeight)
           .fill(primaryOrange);
        
        doc.fillColor(darkGray)
           .fontSize(10)
           .font('Helvetica')
           .text('Nivel de Madurez Digital', 55, currentY + 15);
        
        doc.fillColor(primaryOrange)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(empresa.nivelMadurez || 'N/A', 55, currentY + 32);
        
        doc.fillColor(primaryBlue)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(`${empresa.puntajeGeneral ? empresa.puntajeGeneral.toFixed(1) : '0'}%`, doc.page.width - 160, currentY + 32, { align: 'right', width: 100 });
        
        doc.y = currentY + cardHeight + 20;
        
        // Dimensiones
        drawSectionHeader('PUNTAJES POR DIMENSION');
        
        const dimensiones = [
          { nombre: 'Tecnologia', puntaje: empresa.puntajeTecnologia || 0 },
          { nombre: 'Comunicacion', puntaje: empresa.puntajeComunicacion || 0 },
          { nombre: 'Organizacion', puntaje: empresa.puntajeOrganizacion || 0 },
          { nombre: 'Datos', puntaje: empresa.puntajeDatos || 0 },
          { nombre: 'Estrategia', puntaje: empresa.puntajeEstrategia || 0 },
          { nombre: 'Procesos', puntaje: empresa.puntajeProcesos || 0 }
        ];
        
        currentY = doc.y;
        const dimHeight = 38;
        const colWidth = (doc.page.width - 100) / 3;
        
        dimensiones.forEach((dim, index) => {
          const col = index % 3;
          const row = Math.floor(index / 3);
          const x = 40 + (col * colWidth);
          const y = currentY + (row * dimHeight);
          
          // Nombre de la dimensión
          doc.fillColor(primaryBlue)
             .fontSize(9)
             .font('Helvetica-Bold')
             .text(dim.nombre, x, y);
          
          // Progress bar mejorada
          const barWidth = colWidth - 20;
          const barHeight = 12;
          const fillWidth = (dim.puntaje / 100) * barWidth;
          
          // Fondo de la barra (gris claro)
          doc.rect(x, y + 14, barWidth, barHeight)
             .fill(lightGray);
          
          // Borde de la barra
          doc.rect(x, y + 14, barWidth, barHeight)
             .strokeColor('#cccccc')
             .lineWidth(0.5)
             .stroke();
          
          // Relleno de la barra (naranja)
          if (fillWidth > 0) {
            doc.rect(x, y + 14, fillWidth, barHeight)
               .fill(primaryOrange);
          }
          
          // Puntaje
          doc.fillColor(primaryBlue)
             .fontSize(9)
             .font('Helvetica-Bold')
             .text(`${dim.puntaje.toFixed(1)}%`, x, y + 29, { width: barWidth, align: 'center' });
        });
        
        doc.y = currentY + (Math.ceil(dimensiones.length / 3) * dimHeight) + 25;
        
        // === HISTORIAL DE CHEQUEOS ===
        // Verificar si necesitamos nueva página ANTES de dibujar la sección
        const sectionHeaderHeight = 15; // altura del header de sección
        const tableHeaderHeight = 24;
        const rowHeight = 20;
        const footerMargin = 25; // espacio para línea naranja del footer
        
        // Calcular espacio disponible en la página actual (más preciso)
        const currentPageAvailableSpace = doc.page.height - doc.y - footerMargin;
        
        let needsNewPageForTable = false;
        
        if (historial && historial.length > 0) {
          const rowsToShow = Math.min(historial.length, 20);
          // Calcular altura total necesaria: header sección + header tabla + filas + espaciado
          const estimatedTableHeight = sectionHeaderHeight + tableHeaderHeight + (rowsToShow * rowHeight) + 15;
          
          // Solo agregar página si el contenido NO cabe en la página actual
          // Usar un margen de seguridad más pequeño para ser más preciso
          if (currentPageAvailableSpace < estimatedTableHeight) {
            needsNewPageForTable = true;
          }
        } else {
          // Si no hay historial, solo verificar si hay espacio para el mensaje
          if (currentPageAvailableSpace < sectionHeaderHeight + 30) {
            needsNewPageForTable = true;
          }
        }
        
        if (needsNewPageForTable) {
          doc.addPage();
          drawHeader();
          doc.y = 95;
        }
        
        drawSectionHeader(`HISTORIAL DE CHEQUEOS (${totalChequeos})`);
        
        if (historial && historial.length > 0) {
          // Tabla de historial mejorada
          const tableHeaders = ['Fecha', 'Nivel', 'Puntaje', 'Tec', 'Proc', 'Org', 'Com', 'Dat', 'Est'];
          const colWidths = [90, 75, 55, 38, 38, 38, 38, 38, 38];
          const tableWidth = colWidths.reduce((a, b) => a + b, 0);
          
          let y = doc.y;
          const headerHeight = 24;
          
          // Table header mejorado
          doc.rect(40, y, tableWidth, headerHeight).fill(primaryBlue);
          
          doc.fillColor(white)
             .fontSize(9)
             .font('Helvetica-Bold');
          
          let x = 40;
          tableHeaders.forEach((header, i) => {
            doc.text(header, x + 6, y + 8, { width: colWidths[i] - 12, align: 'center' });
            x += colWidths[i];
          });
          
          y += headerHeight;
          let tableStartYForBorder = y; // Guardar Y inicial para el borde
          doc.y = y; // Sincronizar doc.y con y
          
          // Table rows mejoradas
          const rowsToShow = Math.min(historial.length, 20);
          historial.slice(0, rowsToShow).forEach((chequeo, rowIndex) => {
            // Sincronizar y con doc.y antes de verificar espacio
            y = doc.y;
            
            // Check if we need a new page BEFORE drawing the row
            // Solo agregar página si realmente no cabe (verificar espacio disponible real)
            const spaceNeeded = rowHeight + 5; // Margen de seguridad adicional
            const spaceAvailable = doc.page.height - y - footerMargin;
            
            // Solo agregar página si:
            // 1. No hay espacio suficiente para la fila completa
            // 2. No es la primera fila (siempre intentar dibujar al menos una)
            // 3. Hay más filas por venir
            if (spaceAvailable < spaceNeeded && rowIndex > 0 && rowIndex < rowsToShow) {
              // Draw border for current page antes de cambiar
              doc.rect(40, tableStartYForBorder, tableWidth, y - tableStartYForBorder).stroke(primaryBlue);
              
              doc.addPage();
              drawHeader();
              y = 95;
              doc.y = y; // Sincronizar
              tableStartYForBorder = y; // Actualizar inicio de tabla para nueva página
              
              // Redraw header de tabla
              doc.rect(40, y, tableWidth, headerHeight).fill(primaryBlue);
              doc.fillColor(white).fontSize(9).font('Helvetica-Bold');
              x = 40;
              tableHeaders.forEach((header, i) => {
                doc.text(header, x + 6, y + 8, { width: colWidths[i] - 12, align: 'center' });
                x += colWidths[i];
              });
              y += headerHeight;
              doc.y = y; // Sincronizar
            }
            
            // Asegurar que y esté sincronizado antes de dibujar
            y = doc.y;
            
            const bgColor = rowIndex % 2 === 0 ? white : lightGray;
            doc.rect(40, y, tableWidth, rowHeight).fill(bgColor);
            
            doc.fillColor('#000000')
               .fontSize(8)
               .font('Helvetica');
            
            x = 40;
            const rowData = [
              formatDate(chequeo.FechaTest) || 'N/A',
              (chequeo.nivelMadurez || 'N/A').toString(),
              chequeo.puntajeGeneral ? `${chequeo.puntajeGeneral.toFixed(1)}%` : 'N/A',
              chequeo.ptjeDimensionTecnologia ? `${chequeo.ptjeDimensionTecnologia.toFixed(1)}%` : '-',
              chequeo.ptjeDimensionProcesos ? `${chequeo.ptjeDimensionProcesos.toFixed(1)}%` : '-',
              chequeo.ptjeDimensionOrganizacion ? `${chequeo.ptjeDimensionOrganizacion.toFixed(1)}%` : '-',
              chequeo.ptjeDimensionComunicacion ? `${chequeo.ptjeDimensionComunicacion.toFixed(1)}%` : '-',
              chequeo.ptjeDimensionDatos ? `${chequeo.ptjeDimensionDatos.toFixed(1)}%` : '-',
              chequeo.ptjeDimensionEstrategia ? `${chequeo.ptjeDimensionEstrategia.toFixed(1)}%` : '-'
            ];
            
            // Dibujar todas las celdas de la fila en la misma posición Y
            rowData.forEach((cell, i) => {
              // Bold para puntaje general
              if (i === 2) {
                doc.font('Helvetica-Bold');
              } else {
                doc.font('Helvetica');
              }
              // Alineación mejorada
              const align = i === 0 ? 'left' : 'center';
              // Asegurar que todas las celdas se dibujen en la misma Y
              doc.text(cell || '-', x + 6, y + 6, { width: colWidths[i] - 12, align: align });
              x += colWidths[i];
            });
            
            // Actualizar Y después de dibujar toda la fila
            y += rowHeight;
            doc.y = y; // Sincronizar doc.y con y
          });
          
          // Table border final
          doc.rect(40, tableStartYForBorder, tableWidth, y - tableStartYForBorder).stroke(primaryBlue);
          
          doc.y = y + 15;
          
          // === ANALISIS DE EVOLUCION ===
          if (historial.length >= 2) {
            // Calcular altura real necesaria para evolución (incluye nuevas métricas)
            // Header + Evolución puntaje + Dimensiones líderes + Dimensiones pérdidas + Cambio nivel + Tiempo
            const evolutionSectionHeight = 15 + 50 + 20 + (3 * 25) + 20 + (3 * 25) + 20 + 45 + 20 + 50 + 20; // ~350pts total
            const availableSpaceForEvolution = doc.page.height - doc.y - footerMargin;
            
            // Solo agregar página si el contenido NO cabe en el espacio disponible
            if (availableSpaceForEvolution < evolutionSectionHeight) {
              doc.addPage();
              drawHeader();
              doc.y = 95;
            }
            
            drawSectionHeader('ANALISIS DE EVOLUCION');
            
            const ultimoChequeo = historial[0];
            const primerChequeo = historial[historial.length - 1];
            
            const evolucionPuntaje = (ultimoChequeo.puntajeGeneral || 0) - (primerChequeo.puntajeGeneral || 0);
            const evolucionColor = evolucionPuntaje >= 0 ? '#22c55e' : '#ef4444';
            
            currentY = doc.y;
            
            doc.rect(40, currentY, doc.page.width - 80, 50)
               .fillAndStroke(lightGray, primaryBlue);
            
            doc.fillColor('#000000')
               .fontSize(10)
               .font('Helvetica')
               .text('Evolucion del Puntaje General', 50, currentY + 12);
            
            doc.fillColor(evolucionColor)
               .fontSize(18)
               .font('Helvetica-Bold')
               .text(`${evolucionPuntaje >= 0 ? '+' : ''}${evolucionPuntaje.toFixed(1)}%`, doc.page.width - 150, currentY + 22, { align: 'right', width: 100 });
            
            doc.y = currentY + 65;
            
            // Dimensiones líderes
            doc.fillColor('#000000')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('Dimensiones Lideres:', 40, doc.y);
            
            doc.y += 20;
            
            const dimensionesOrdenadas = [
              { nombre: 'Tecnologia', puntaje: ultimoChequeo.ptjeDimensionTecnologia || 0 },
              { nombre: 'Procesos', puntaje: ultimoChequeo.ptjeDimensionProcesos || 0 },
              { nombre: 'Organizacion', puntaje: ultimoChequeo.ptjeDimensionOrganizacion || 0 },
              { nombre: 'Comunicacion', puntaje: ultimoChequeo.ptjeDimensionComunicacion || 0 },
              { nombre: 'Datos', puntaje: ultimoChequeo.ptjeDimensionDatos || 0 },
              { nombre: 'Estrategia', puntaje: ultimoChequeo.ptjeDimensionEstrategia || 0 }
            ].sort((a, b) => b.puntaje - a.puntaje);
            
            currentY = doc.y;
            
            dimensionesOrdenadas.slice(0, 3).forEach((dim, index) => {
              doc.fillColor(primaryOrange)
                 .fontSize(12)
                 .font('Helvetica-Bold')
                 .text(`${index + 1}.`, 50, currentY);
              
              doc.fillColor('#000000')
                 .fontSize(10)
                 .font('Helvetica')
                 .text(`${dim.nombre}`, 70, currentY + 2);
              
              doc.fillColor(primaryBlue)
                 .fontSize(11)
                 .font('Helvetica-Bold')
                 .text(`${dim.puntaje.toFixed(1)}%`, doc.page.width - 100, currentY, { align: 'right', width: 60 });
              
              currentY += 25;
            });
            
            doc.y = currentY + 10;
            
            // === NUEVAS MÉTRICAS DE EVOLUCIÓN ===
            // Comparar último (N) vs penúltimo (N-1) chequeo
            const penultimoChequeo = historial[1];
            
            // Función helper para obtener nivel de madurez
            const getMaturityLevel = (puntaje) => {
              if (!puntaje || puntaje < 30) return 'Inicial';
              if (puntaje < 60) return 'Novato';
              if (puntaje < 80) return 'Competente';
              return 'Avanzado';
            };
            
            // Función helper para obtener orden numérico de nivel
            const getMaturityOrder = (nivel) => {
              const order = { 'Inicial': 1, 'Novato': 2, 'Competente': 3, 'Avanzado': 4 };
              return order[nivel] || 0;
            };
            
            const nivelUltimo = getMaturityLevel(ultimoChequeo.puntajeGeneral);
            const nivelPenultimo = getMaturityLevel(penultimoChequeo.puntajeGeneral);
            const ordenUltimo = getMaturityOrder(nivelUltimo);
            const ordenPenultimo = getMaturityOrder(nivelPenultimo);
            
            // Verificar si hay espacio suficiente para las nuevas secciones
            const newSectionsHeight = 20 + 20 + (3 * 25) + 20 + 20 + 30; // ~155pts
            const availableSpace = doc.page.height - doc.y - footerMargin;
            
            if (availableSpace < newSectionsHeight) {
              doc.addPage();
              drawHeader();
              doc.y = 95;
            }
            
            // 1. Dimensiones con más pérdidas
            const dimensionesConPerdidas = [
              { 
                nombre: 'Tecnologia', 
                perdida: (penultimoChequeo.ptjeDimensionTecnologia || 0) - (ultimoChequeo.ptjeDimensionTecnologia || 0),
                anterior: penultimoChequeo.ptjeDimensionTecnologia || 0,
                actual: ultimoChequeo.ptjeDimensionTecnologia || 0
              },
              { 
                nombre: 'Procesos', 
                perdida: (penultimoChequeo.ptjeDimensionProcesos || 0) - (ultimoChequeo.ptjeDimensionProcesos || 0),
                anterior: penultimoChequeo.ptjeDimensionProcesos || 0,
                actual: ultimoChequeo.ptjeDimensionProcesos || 0
              },
              { 
                nombre: 'Organizacion', 
                perdida: (penultimoChequeo.ptjeDimensionOrganizacion || 0) - (ultimoChequeo.ptjeDimensionOrganizacion || 0),
                anterior: penultimoChequeo.ptjeDimensionOrganizacion || 0,
                actual: ultimoChequeo.ptjeDimensionOrganizacion || 0
              },
              { 
                nombre: 'Comunicacion', 
                perdida: (penultimoChequeo.ptjeDimensionComunicacion || 0) - (ultimoChequeo.ptjeDimensionComunicacion || 0),
                anterior: penultimoChequeo.ptjeDimensionComunicacion || 0,
                actual: ultimoChequeo.ptjeDimensionComunicacion || 0
              },
              { 
                nombre: 'Datos', 
                perdida: (penultimoChequeo.ptjeDimensionDatos || 0) - (ultimoChequeo.ptjeDimensionDatos || 0),
                anterior: penultimoChequeo.ptjeDimensionDatos || 0,
                actual: ultimoChequeo.ptjeDimensionDatos || 0
              },
              { 
                nombre: 'Estrategia', 
                perdida: (penultimoChequeo.ptjeDimensionEstrategia || 0) - (ultimoChequeo.ptjeDimensionEstrategia || 0),
                anterior: penultimoChequeo.ptjeDimensionEstrategia || 0,
                actual: ultimoChequeo.ptjeDimensionEstrategia || 0
              }
            ].filter(dim => dim.perdida > 0).sort((a, b) => b.perdida - a.perdida);
            
            if (dimensionesConPerdidas.length > 0) {
              doc.fillColor('#000000')
                 .fontSize(11)
                 .font('Helvetica-Bold')
                 .text('Dimensiones con Mayor Perdida:', 40, doc.y);
              
              doc.y += 20;
              currentY = doc.y;
              
              dimensionesConPerdidas.slice(0, 3).forEach((dim, index) => {
                doc.fillColor('#ef4444') // Rojo para pérdidas
                   .fontSize(12)
                   .font('Helvetica-Bold')
                   .text(`${index + 1}.`, 50, currentY);
                
                doc.fillColor('#000000')
                   .fontSize(10)
                   .font('Helvetica')
                   .text(`${dim.nombre}`, 70, currentY + 2);
                
                doc.fillColor('#ef4444')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`-${dim.perdida.toFixed(1)}%`, doc.page.width - 100, currentY, { align: 'right', width: 60 });
                
                // Mostrar valores anterior y actual
                doc.fillColor(darkGray)
                   .fontSize(8)
                   .font('Helvetica')
                   .text(`(${dim.anterior.toFixed(1)}% → ${dim.actual.toFixed(1)}%)`, doc.page.width - 200, currentY + 12, { align: 'right', width: 160 });
                
                currentY += 25;
              });
              
              doc.y = currentY + 5;
            }
            
            // 2. Cambio de nivel de madurez
            const cambioNivel = ordenUltimo - ordenPenultimo;
            let cambioNivelTexto = '';
            let cambioNivelColor = '#000000';
            
            if (cambioNivel < 0) {
              // Bajó de nivel
              cambioNivelTexto = `Bajo de nivel: ${nivelPenultimo} a ${nivelUltimo}`;
              cambioNivelColor = '#ef4444'; // Rojo
            } else if (cambioNivel > 0) {
              // Subió de nivel
              cambioNivelTexto = `Subio de nivel: ${nivelPenultimo} a ${nivelUltimo}`;
              cambioNivelColor = '#22c55e'; // Verde
            } else {
              // Mismo nivel
              cambioNivelTexto = `Mantiene nivel: ${nivelUltimo}`;
              cambioNivelColor = '#6b7280'; // Gris
            }
            
            // Verificar espacio para cambio de nivel
            if (doc.page.height - doc.y - footerMargin < 40) {
              doc.addPage();
              drawHeader();
              doc.y = 95;
            }
            
            doc.fillColor('#000000')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('Cambio de Nivel de Madurez:', 40, doc.y);
            
            doc.y += 20;
            
            doc.fillColor(cambioNivelColor)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(cambioNivelTexto, 50, doc.y);
            
            // Mostrar puntajes
            doc.fillColor(darkGray)
               .fontSize(9)
               .font('Helvetica')
               .text(`Puntaje anterior: ${penultimoChequeo.puntajeGeneral?.toFixed(1) || 'N/A'}%`, 50, doc.y + 15);
            
            doc.fillColor(darkGray)
               .fontSize(9)
               .font('Helvetica')
               .text(`Puntaje actual: ${ultimoChequeo.puntajeGeneral?.toFixed(1) || 'N/A'}%`, 50, doc.y + 28);
            
            doc.y += 45;
            
            // 3. Diferencia de tiempo entre chequeos
            if (ultimoChequeo.FechaTest && penultimoChequeo.FechaTest) {
              const fechaUltimo = new Date(ultimoChequeo.FechaTest);
              const fechaPenultimo = new Date(penultimoChequeo.FechaTest);
              
              // Calcular diferencia en milisegundos
              const diffMs = fechaUltimo.getTime() - fechaPenultimo.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const diffMonths = Math.floor(diffDays / 30);
              const remainingDays = diffDays % 30;
              
              // Verificar espacio para diferencia de tiempo
              if (doc.page.height - doc.y - footerMargin < 30) {
                doc.addPage();
                drawHeader();
                doc.y = 95;
              }
              
              doc.fillColor('#000000')
                 .fontSize(11)
                 .font('Helvetica-Bold')
                 .text('Tiempo entre Chequeos:', 40, doc.y);
              
              doc.y += 20;
              
              let tiempoTexto = '';
              if (diffMonths > 0) {
                tiempoTexto = `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
                if (remainingDays > 0) {
                  tiempoTexto += ` y ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`;
                }
              } else {
                tiempoTexto = `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
              }
              
              doc.fillColor(primaryBlue)
                 .fontSize(11)
                 .font('Helvetica-Bold')
                 .text(tiempoTexto, 50, doc.y);
              
              // Mostrar fechas
              doc.fillColor(darkGray)
                 .fontSize(9)
                 .font('Helvetica')
                 .text(`Chequeo anterior: ${formatDate(penultimoChequeo.FechaTest)}`, 50, doc.y + 15);
              
              doc.fillColor(darkGray)
                 .fontSize(9)
                 .font('Helvetica')
                 .text(`Ultimo chequeo: ${formatDate(ultimoChequeo.FechaTest)}`, 50, doc.y + 28);
              
              doc.y += 50;
            }
          }
        } else {
          doc.fillColor(darkGray)
             .fontSize(10)
             .font('Helvetica-Oblique')
             .text('No hay historial de chequeos disponible', 40, doc.y);
          doc.y += 30;
        }
        
        // Footer on all pages - Solo línea naranja
        // Obtener el rango de páginas DESPUÉS de todo el contenido
        const pages = doc.bufferedPageRange();
        
        // Solo dibujar línea naranja en todas las páginas
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          
          // Footer line (orange accent) - línea naranja simple
          doc.moveTo(40, doc.page.height - 20)
             .lineTo(doc.page.width - 40, doc.page.height - 20)
             .lineWidth(1)
             .strokeColor(primaryOrange)
             .stroke();
        }
        
        doc.end();
        
        return new Promise((resolve, reject) => {
          stream.on('finish', () => {
            logger.info(`Empresa ficha exported to PDF: ${filePath}`);
            resolve(filePath);
          });
          stream.on('error', reject);
        });
      } catch (error) {
        logger.error(`Error exporting empresa ficha to PDF: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        throw error;
      }
    }

  /**
   * Export data to CSV format
   * @param {Array} data - The data to export
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportToCSV(data, fileName) {
    try {
      if (!data || !data.length) {
        throw new Error('No data to export');
      }
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Generate CSV buffer directly (no file writing)
      const csvBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'csv' });
      
      logger.info(`Data exported to CSV buffer: ${data.length} rows`);
      return csvBuffer;
    } catch (error) {
      logger.error(`Error exporting to CSV: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Export data to Excel format
   * @param {Array} data - The data to export
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportToExcel(data, fileName) {
    try {
      if (!data || !data.length) {
        throw new Error('No data to export');
      }
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const exportDir = path.join(config.logging.directory, 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filePath = path.join(exportDir, `${fileName}_${Date.now()}.xlsx`);
      xlsx.writeFile(workbook, filePath);
      
      logger.info(`Data exported to Excel: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Error exporting to Excel: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Export empresas data to Excel with summary and detailed sheets
   * @param {Object} summaryData - Summary statistics
   * @param {Array} detailedData - Detailed company list
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportEmpresasToExcel(summaryData, detailedData, fileName) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Sheet 1: Summary
      const summarySheet = workbook.addWorksheet('Resumen');
      
      // Add header styling
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF150773' } },
        alignment: { vertical: 'middle', horizontal: 'center' }
      };
      
      // Add summary data
      summarySheet.columns = [
        { header: 'Métrica', key: 'metric', width: 50 },
        { header: 'Valor', key: 'value', width: 20 }
      ];
      
      summarySheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });
      
      summarySheet.addRow({ metric: 'Total Chequeos Realizados por Departamento y Distrito', value: summaryData.totalChequeos || 0 });
      summarySheet.addRow({ metric: 'Total Empresas Chequeadas', value: summaryData.totalEmpresas || 0 });
      summarySheet.addRow({ metric: 'Empresas por Tamaño - Micro', value: summaryData.empresasMicro || 0 });
      summarySheet.addRow({ metric: 'Empresas por Tamaño - Pequeña', value: summaryData.empresasPequena || 0 });
      summarySheet.addRow({ metric: 'Empresas por Tamaño - Mediana', value: summaryData.empresasMediana || 0 });
      summarySheet.addRow({ metric: 'Empresas por Tamaño - Grande', value: summaryData.empresasGrande || 0 });
      
      // Add sector data
      if (summaryData.empresasPorSector) {
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: 'Empresas por Sector de Actividad', value: '' });
        Object.entries(summaryData.empresasPorSector).forEach(([sector, count]) => {
          summarySheet.addRow({ metric: `  ${sector}`, value: count });
        });
      }
      
      // Add subsector data
      if (summaryData.empresasPorSubSector) {
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: 'Empresas por Subsector de Actividad', value: '' });
        Object.entries(summaryData.empresasPorSubSector).forEach(([subsector, count]) => {
          summarySheet.addRow({ metric: `  ${subsector}`, value: count });
        });
      }
      
      // Add gender data
      if (summaryData.generoGerentes) {
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: 'Género del Propietario/Gerente', value: '' });
        Object.entries(summaryData.generoGerentes).forEach(([genero, count]) => {
          summarySheet.addRow({ metric: `  ${genero}`, value: count });
        });
      }
      
      // Sheet 2: Detailed List
      const detailSheet = workbook.addWorksheet('Listado Completo');
      
      detailSheet.columns = [
        { header: 'Empresa', key: 'empresa', width: 30 },
        { header: 'Responsable', key: 'responsable', width: 25 },
        { header: 'Correo Electrónico', key: 'email', width: 30 },
        { header: 'Tamaño', key: 'tamano', width: 15 },
        { header: 'Ubicación', key: 'ubicacion', width: 25 },
        { header: 'Sector', key: 'sector', width: 25 },
        { header: 'Empleados', key: 'empleados', width: 12 },
        { header: 'Fecha Test', key: 'fechaTest', width: 15 },
        { header: 'Madurez', key: 'madurez', width: 15 },
        { header: 'Puntaje General', key: 'puntajeGeneral', width: 18 },
        { header: 'Tecnología', key: 'tecnologia', width: 15 },
        { header: 'Procesos', key: 'procesos', width: 15 },
        { header: 'Organización', key: 'organizacion', width: 15 },
        { header: 'Comunicación', key: 'comunicacion', width: 15 },
        { header: 'Datos', key: 'datos', width: 15 },
        { header: 'Estrategia', key: 'estrategia', width: 15 }
      ];
      
      detailSheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });
      
      detailedData.forEach(item => {
        detailSheet.addRow({
          empresa: item.empresa || 'N/A',
          responsable: item.nombreCompleto || 'N/A',
          email: item.email || 'N/A',
          tamano: item.ventasAnuales || 'N/A',
          ubicacion: `${item.departamento || ''} - ${item.distrito || ''}`,
          sector: item.sectorActividadDescripcion || 'N/A',
          empleados: item.totalEmpleados || 0,
          fechaTest: item.fechaTest || 'N/A',
          madurez: item.nivelDeMadurezGeneral || 'N/A',
          puntajeGeneral: item.puntajeNivelDeMadurezGeneral !== null && item.puntajeNivelDeMadurezGeneral !== undefined 
            ? `${Number(item.puntajeNivelDeMadurezGeneral).toFixed(2)}%` 
            : 'N/A',
          tecnologia: item.ptjeDimensionTecnologia !== null && item.ptjeDimensionTecnologia !== undefined 
            ? `${Number(item.ptjeDimensionTecnologia).toFixed(2)}%` 
            : 'N/A',
          procesos: item.ptjeDimensionProcesos !== null && item.ptjeDimensionProcesos !== undefined 
            ? `${Number(item.ptjeDimensionProcesos).toFixed(2)}%` 
            : 'N/A',
          organizacion: item.ptjeDimensionOrganizacion !== null && item.ptjeDimensionOrganizacion !== undefined 
            ? `${Number(item.ptjeDimensionOrganizacion).toFixed(2)}%` 
            : 'N/A',
          comunicacion: item.ptjeDimensionComunicacion !== null && item.ptjeDimensionComunicacion !== undefined 
            ? `${Number(item.ptjeDimensionComunicacion).toFixed(2)}%` 
            : 'N/A',
          datos: item.ptjeDimensionDatos !== null && item.ptjeDimensionDatos !== undefined 
            ? `${Number(item.ptjeDimensionDatos).toFixed(2)}%` 
            : 'N/A',
          estrategia: item.ptjeDimensionEstrategia !== null && item.ptjeDimensionEstrategia !== undefined 
            ? `${Number(item.ptjeDimensionEstrategia).toFixed(2)}%` 
            : 'N/A'
        });
      });
      
      const exportDir = path.join(config.logging.directory, 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filePath = path.join(exportDir, `${fileName}_${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(filePath);
      
      logger.info(`Empresas data exported to Excel: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Error exporting empresas to Excel: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Export empresas summary to PDF with spectacular modern design
   * @param {Object} summaryData - Summary statistics
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportEmpresasToPDF(summaryData, fileName) {
    try {
      const exportDir = path.join(config.logging.directory, 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filePath = path.join(exportDir, `${fileName}_${Date.now()}.pdf`);
      const doc = new PDFDocument({ 
        margin: 0,
        size: 'A4',
        bufferPages: true
      });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Modern Color Palette
      const colors = {
        primaryBlue: '#150773',
        secondaryBlue: '#1a0a8f',
        lightBlue: '#2d1db8',
        accentBlue: '#4a3fcc',
        primaryOrange: '#f5592b',
        lightOrange: '#ff7043',
        accentOrange: '#ffab91',
        white: '#FFFFFF',
        lightGray: '#f8f9fa',
        mediumGray: '#e9ecef',
        darkGray: '#495057',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        gradient1: '#150773',
        gradient2: '#2d1db8',
        cardShadow: 'rgba(21, 7, 115, 0.08)'
      };
      
      // Helper: Format date elegantly
      const formatDate = (dateStr) => {
        if (!dateStr) return 'No especificada';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };
      
      // Helper: Draw gradient background
      const drawGradientBg = (y, height, startColor, endColor) => {
        const steps = 50;
        const stepHeight = height / steps;
        
        for (let i = 0; i < steps; i++) {
          const ratio = i / steps;
          // Simple linear interpolation for gradient effect
          doc.rect(0, y + (i * stepHeight), doc.page.width, stepHeight)
             .fillOpacity(1 - (ratio * 0.3))
             .fill(startColor);
        }
        doc.fillOpacity(1);
      };
      
      // Helper: Draw modern header with diagonal accent
      const drawHeader = () => {
        // Gradient background
        doc.rect(0, 0, doc.page.width, 140)
           .fill(colors.primaryBlue);
        
        // Diagonal accent stripe (creates dynamic movement)
        doc.save();
        doc.polygon(
          [0, 120],
          [doc.page.width, 100],
          [doc.page.width, 140],
          [0, 140]
        ).fill(colors.secondaryBlue);
        doc.restore();
        
        // Orange accent line with glow effect
        doc.rect(0, 136, doc.page.width, 4).fill(colors.primaryOrange);
        doc.rect(0, 134, doc.page.width, 2).fillOpacity(0.3).fill(colors.primaryOrange);
        doc.fillOpacity(1);
        
        // Decorative circles (modern design element)
        doc.circle(doc.page.width - 50, 30, 60).fillOpacity(0.05).fill(colors.white);
        doc.circle(doc.page.width - 80, 70, 40).fillOpacity(0.03).fill(colors.white);
        doc.fillOpacity(1);
        
        // Title with modern typography
        doc.fillColor(colors.white)
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('REPORTE', 50, 35, { 
             align: 'left',
             characterSpacing: 1
           });
        
        // Subtitle with lighter weight
        doc.fontSize(11)
           .font('Helvetica')
           .fillOpacity(0.9)
           .text('Chequeo Digital - Programa de Innovación', 50, 70, { align: 'left' });
        doc.fillOpacity(1);
        
        // Date range in modern card
        const rangoFechas = summaryData.fechaIni && summaryData.fechaFin
          ? `${formatDate(summaryData.fechaIni)} - ${formatDate(summaryData.fechaFin)}`
          : 'Todos los tiempos';
        
        doc.roundedRect(50, 90, 250, 30, 4)
           .fillOpacity(0.15)
           .fill(colors.white);
        doc.fillOpacity(1);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(colors.white)
           .fillOpacity(0.8)
           .text('PERIODO', 60, 96);
        doc.fillOpacity(1);
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(colors.white)
           .text(rangoFechas, 60, 107);
        
        // Generation timestamp
        const fechaGeneracion = new Date().toLocaleString('es-ES', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        doc.fontSize(7)
           .font('Helvetica')
           .fillOpacity(0.7)
           .text(`Generado: ${fechaGeneracion}`, 310, 105, { align: 'left' });
        doc.fillOpacity(1);
        
        // Logos with modern placement (MIC primero, BID segundo)
        const logoBIDPath = path.join(__dirname, '../../../public/logoBID.png');
        const logoMICPath = path.join(__dirname, '../../../public/logoMIC.png');
        
        // Logo containers with subtle backgrounds
        doc.roundedRect(doc.page.width - 195, 25, 80, 80, 6)
           .fillOpacity(0.1)
           .fill(colors.white);
        doc.roundedRect(doc.page.width - 105, 25, 80, 80, 6)
           .fillOpacity(0.1)
           .fill(colors.white);
        doc.fillOpacity(1);
        
        try {
          if (fs.existsSync(logoMICPath)) {
            doc.image(logoMICPath, doc.page.width - 185, 35, { 
              width: 60, 
              height: 60, 
              fit: [60, 60] 
            });
          }
        } catch (e) {
          logger.warn(`Could not load MIC logo: ${e.message}`);
        }
        
        try {
          if (fs.existsSync(logoBIDPath)) {
            doc.image(logoBIDPath, doc.page.width - 95, 35, { 
              width: 60, 
              height: 60, 
              fit: [60, 60] 
            });
          }
        } catch (e) {
          logger.warn(`Could not load BID logo: ${e.message}`);
        }
      };
      
      // Helper: Draw section header with modern style
      const drawSectionHeader = (title, icon = null) => {
        // Orange accent bar
        doc.rect(50, doc.y, 5, 24)
           .fill(colors.primaryOrange);
        
        // Title
        doc.fillColor(colors.primaryBlue)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(title, 65, doc.y + 4);
        
        // Subtle underline
        const textWidth = doc.widthOfString(title);
        doc.moveTo(65, doc.y + 28)
           .lineTo(65 + textWidth, doc.y + 28)
           .lineWidth(1.5)
           .strokeOpacity(0.2)
           .strokeColor(colors.primaryBlue)
           .stroke();
        doc.strokeOpacity(1);
        
        doc.y += 40;
      };
      
      // Helper: Draw ultra-modern KPI card with glass morphism effect
      const drawModernKPICard = (label, value, x, y, width, height, accentColor) => {
        // Outer glow/shadow
        doc.roundedRect(x + 1, y + 2, width, height, 8)
           .fillOpacity(0.08)
           .fill(colors.darkGray);
        doc.fillOpacity(1);
        
        // Main card with gradient border effect
        doc.roundedRect(x, y, width, height, 8)
           .lineWidth(1.5)
           .strokeOpacity(0.1)
           .stroke(colors.primaryBlue)
           .fillAndStroke(colors.white, colors.primaryBlue);
        doc.strokeOpacity(1);
        
        // Top accent gradient bar
        doc.rect(x, y, width, 6)
           .fill(accentColor);
        doc.roundedRect(x, y, width, 8, 8)
           .fill(accentColor);
        
        // Icon circle background
        doc.circle(x + width / 2, y + 32, 22)
           .fillOpacity(0.08)
           .fill(accentColor);
        doc.fillOpacity(1);
        
        // Value with modern typography
        doc.fillColor(accentColor)
           .fontSize(26)
           .font('Helvetica-Bold')
           .text(value.toString(), x + 10, y + 18, { 
             width: width - 20, 
             align: 'center',
             characterSpacing: -0.5
           });
        
        // Label with better spacing
        doc.fillColor(colors.textSecondary)
           .fontSize(8.5)
           .font('Helvetica')
           .text(label.toUpperCase(), x + 10, y + height - 28, { 
             width: width - 20, 
             align: 'center',
             characterSpacing: 0.5
           });
      };
      
      // Helper: Draw modern horizontal bar chart with animations feel
      const drawModernBarChart = (data, startY, maxBars = 8) => {
        const chartWidth = doc.page.width - 120;
        const labelWidth = 160;
        const barAreaWidth = chartWidth - labelWidth - 100;
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        
        if (total === 0) {
          doc.fillColor(colors.textSecondary)
             .fontSize(10)
             .font('Helvetica')
             .text('No hay datos disponibles', 60, startY);
          doc.y = startY + 30;
          return;
        }
        
        let y = startY;
        const entries = Object.entries(data).slice(0, maxBars);
        const barHeight = 16;
        const barSpacing = 22;
        
        entries.forEach(([label, value], index) => {
          const percentage = (value / total) * 100;
          const barWidth = Math.max((value / total) * barAreaWidth, 8);
          
          // Alternating row backgrounds
          if (index % 2 === 0) {
            doc.roundedRect(50, y - 2, chartWidth + 10, barHeight + 4, 4)
               .fillOpacity(0.03)
               .fill(colors.primaryBlue);
            doc.fillOpacity(1);
          }
          
          // Label
          doc.fillColor(colors.textPrimary)
             .fontSize(9)
             .font('Helvetica')
             .text(
               label.length > 28 ? label.substring(0, 25) + '...' : label, 
               60, 
               y + 3, 
               { width: labelWidth - 10 }
             );
          
          // Bar background track
          doc.roundedRect(labelWidth + 60, y, barAreaWidth, barHeight, barHeight / 2)
             .fillOpacity(0.08)
             .fill(colors.primaryBlue);
          doc.fillOpacity(1);
          
          // Gradient bar effect
          const barColor = index % 2 === 0 ? colors.primaryOrange : colors.lightOrange;
          doc.roundedRect(labelWidth + 60, y, barWidth, barHeight, barHeight / 2)
             .fill(barColor);
          
          // Highlight/shine effect on bar
          doc.roundedRect(labelWidth + 60, y, barWidth, barHeight / 3, barHeight / 2)
             .fillOpacity(0.3)
             .fill(colors.white);
          doc.fillOpacity(1);
          
          // Value badge
          const valueText = `${value} (${percentage.toFixed(1)}%)`;
          const valueWidth = doc.widthOfString(valueText) + 16;
          
          doc.roundedRect(
            labelWidth + barAreaWidth + 70, 
            y - 1, 
            valueWidth, 
            barHeight + 2, 
            (barHeight + 2) / 2
          ).fill(colors.lightGray);
          
          doc.fillColor(colors.textPrimary)
             .fontSize(8.5)
             .font('Helvetica-Bold')
             .text(
               valueText, 
               labelWidth + barAreaWidth + 78, 
               y + 4, 
               { width: valueWidth - 16, align: 'center' }
             );
          
          y += barSpacing;
        });
        
        doc.y = y + 10;
      };
      
      // Helper: Draw modern data table with clean design
      const drawModernTable = (headers, rows, startY) => {
        const tableWidth = doc.page.width - 100;
        const colWidths = [tableWidth * 0.55, tableWidth * 0.225, tableWidth * 0.225];
        let y = startY;
        
        // Table container shadow
        doc.roundedRect(49, y - 1, tableWidth + 2, (rows.length + 1) * 22 + 2, 6)
           .fillOpacity(0.06)
           .fill(colors.darkGray);
        doc.fillOpacity(1);
        
        // Table header with gradient
        doc.roundedRect(50, y, tableWidth, 26, 6)
           .fill(colors.primaryBlue);
        
        doc.fillColor(colors.white)
           .fontSize(9.5)
           .font('Helvetica-Bold');
        
        headers.forEach((header, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          const align = i > 0 ? 'center' : 'left';
          doc.text(
            header.toUpperCase(), 
            x + 12, 
            y + 8, 
            { 
              width: colWidths[i] - 24,
              align,
              characterSpacing: 0.5
            }
          );
        });
        
        y += 26;
        
        // Table rows with modern styling
        rows.forEach((row, rowIndex) => {
          const bgColor = rowIndex % 2 === 0 ? colors.white : colors.lightGray;
          
          if (rowIndex === rows.length - 1) {
            doc.roundedRect(50, y, tableWidth, 22, 6).fill(bgColor);
          } else {
            doc.rect(50, y, tableWidth, 22).fill(bgColor);
          }
          
          // Subtle divider line
          if (rowIndex < rows.length - 1) {
            doc.moveTo(60, y + 22)
               .lineTo(50 + tableWidth - 10, y + 22)
               .lineWidth(0.5)
               .strokeOpacity(0.1)
               .strokeColor(colors.primaryBlue)
               .stroke();
            doc.strokeOpacity(1);
          }
          
          doc.fillColor(colors.textPrimary)
             .fontSize(8.5)
             .font('Helvetica');
          
          row.forEach((cell, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            const align = i > 0 ? 'center' : 'left';
            
            // Bold font for numeric values
            if (i > 0) {
              doc.font('Helvetica-Bold');
            } else {
              doc.font('Helvetica');
            }
            
            doc.text(cell, x + 12, y + 6, { 
              width: colWidths[i] - 24, 
              align 
            });
          });
          
          y += 22;
        });
        
        doc.y = y + 15;
      };
      
      // === PAGE 1: COVER PAGE WITH HERO DESIGN ===
      drawHeader();
      doc.y = 180;
      
      // Hero statistics showcase
      drawSectionHeader('ESTADÍSTICAS PRINCIPALES');
      
      // 5 Modern KPI cards in asymmetric layout
      const cardW = 102;
      const cardH = 70;
      const gap = 12;
      const startX = 50;
      let currentY = doc.y;
      
      // First row: 3 cards
      drawModernKPICard(
        'Total Chequeos', 
        summaryData.totalChequeos || 0, 
        startX, 
        currentY, 
        cardW, 
        cardH,
        colors.primaryOrange
      );
      
      drawModernKPICard(
        'Total Empresas', 
        summaryData.totalEmpresas || 0, 
        startX + cardW + gap, 
        currentY, 
        cardW, 
        cardH,
        colors.primaryBlue
      );
      
      drawModernKPICard(
        'Emp. Incipientes', 
        summaryData.empresasIncipientes || 0, 
        startX + (cardW + gap) * 2, 
        currentY, 
        cardW, 
        cardH,
        colors.lightOrange
      );
      
      drawModernKPICard(
        'Total Empleados', 
        summaryData.totalEmpleados || 0, 
        startX + (cardW + gap) * 3, 
        currentY, 
        cardW, 
        cardH,
        colors.lightBlue
      );
      
      // Second row: 1 centered larger card
      currentY += cardH + gap + 6;
      const largeCardW = 160;
      const centerX = (doc.page.width - largeCardW) / 2;
      
      drawModernKPICard(
        'Distritos Chequeados', 
        summaryData.numeroDistritos || 0, 
        centerX, 
        currentY, 
        largeCardW, 
        cardH,
        colors.accentBlue
      );
      
      doc.y = currentY + cardH + 30;
      
      // Empresas por Tamaño with modern chart
      drawSectionHeader('DISTRIBUCIÓN POR TAMAÑO');
      drawModernBarChart({
        'Micro': summaryData.empresasMicro || 0,
        'Pequeña': summaryData.empresasPequena || 0,
        'Mediana': summaryData.empresasMediana || 0,
        'Grande': summaryData.empresasGrande || 0
      }, doc.y);
      
      // Empresas por Nivel de Madurez
      if (summaryData.empresasPorNivel && Object.keys(summaryData.empresasPorNivel).length > 0) {
        if (doc.y > doc.page.height - 220) {
          doc.addPage();
          drawHeader();
          doc.y = 180;
        }
        
        drawSectionHeader('NIVEL DE MADUREZ DIGITAL');
        drawModernBarChart(summaryData.empresasPorNivel, doc.y);
      }
      
      // === PAGE 2: SECTOR ANALYSIS ===
      if (summaryData.empresasPorSector && Object.keys(summaryData.empresasPorSector).length > 0) {
        doc.addPage();
        drawHeader();
        doc.y = 180;
        
        drawSectionHeader('ANÁLISIS POR SECTOR');
        
        const total = Object.values(summaryData.empresasPorSector).reduce((sum, val) => sum + val, 0);
        const sectorRows = Object.entries(summaryData.empresasPorSector)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 15)
          .map(([sector, count]) => [
            sector,
            count.toString(),
            `${((count / total) * 100).toFixed(1)}%`
          ]);
        
        drawModernTable(
          ['Sector de Actividad', 'Cantidad', 'Porcentaje'], 
          sectorRows, 
          doc.y
        );
      }
      
      // Empresas por Departamento
      if (summaryData.empresasPorDepartamento && Object.keys(summaryData.empresasPorDepartamento).length > 0) {
        const deptCount = Object.keys(summaryData.empresasPorDepartamento).length;
        const estimatedHeight = (deptCount * 22) + 80;
        
        if (doc.y + estimatedHeight > doc.page.height - 80) {
          doc.addPage();
          drawHeader();
          doc.y = 180;
        }
        
        drawSectionHeader('DISTRIBUCIÓN GEOGRÁFICA - DEPARTAMENTOS');
        drawModernBarChart(summaryData.empresasPorDepartamento, doc.y);
      }
      
      // === PAGE 3: DISTRICT ANALYSIS ===
      if (summaryData.empresasPorDistrito && Object.keys(summaryData.empresasPorDistrito).length > 0) {
        const estimatedHeight = (8 * 22) + 80;
        
        if (doc.y + estimatedHeight > doc.page.height - 80) {
          doc.addPage();
          drawHeader();
          doc.y = 180;
        }
        
        drawSectionHeader('TOP 8 DISTRITOS');
        
        const topDistricts = Object.entries(summaryData.empresasPorDistrito)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
        
        drawModernBarChart(topDistricts, doc.y, 8);
      }
      
      // Gender distribution if available
      if (summaryData.generoGerentes && Object.keys(summaryData.generoGerentes).length > 0) {
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
          drawHeader();
          doc.y = 180;
        }
        
        drawSectionHeader('GÉNERO DEL PROPIETARIO/GERENTE');
        drawModernBarChart(summaryData.generoGerentes, doc.y, 5);
      }
      
      // Subsector analysis if available
      if (summaryData.empresasPorSubSector && Object.keys(summaryData.empresasPorSubSector).length > 0) {
        doc.addPage();
        drawHeader();
        doc.y = 180;
        
        drawSectionHeader('ANÁLISIS POR SUBSECTOR');
        
        const total = Object.values(summaryData.empresasPorSubSector).reduce((sum, val) => sum + val, 0);
        const subsectorRows = Object.entries(summaryData.empresasPorSubSector)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 15)
          .map(([subsector, count]) => [
            subsector,
            count.toString(),
            `${((count / total) * 100).toFixed(1)}%`
          ]);
        
        drawModernTable(
          ['Subsector de Actividad', 'Cantidad', 'Porcentaje'], 
          subsectorRows, 
          doc.y
        );
      }
      
      // === FOOTER ON ALL PAGES ===
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // Footer background strip
        doc.rect(0, doc.page.height - 50, doc.page.width, 50)
           .fillOpacity(0.02)
           .fill(colors.primaryBlue);
        doc.fillOpacity(1);
        
        // Footer divider line with gradient effect
        doc.moveTo(50, doc.page.height - 48)
           .lineTo(doc.page.width - 50, doc.page.height - 48)
           .lineWidth(1)
           .strokeColor(colors.primaryOrange)
           .stroke();
        
        // Decorative dots
        for (let j = 0; j < 5; j++) {
          doc.circle(70 + (j * 20), doc.page.height - 48, 2)
             .fillOpacity(0.3)
             .fill(colors.primaryOrange);
        }
        doc.fillOpacity(1);
        
        // Footer text (left side)
        doc.fillColor(colors.textSecondary)
           .fontSize(7.5)
           .font('Helvetica')
           .text(
             'Chequeo Digital - Ministerio de Industria y Comercio - BID',
             50,
             doc.page.height - 32,
             { align: 'left' }
           );
        
        // Page number (right side) with modern badge
        const pageText = `${i + 1} / ${pages.count}`;
        const pageTextWidth = doc.widthOfString(pageText) + 20;
        
        doc.roundedRect(
          doc.page.width - pageTextWidth - 50,
          doc.page.height - 38,
          pageTextWidth,
          18,
          9
        ).fill(colors.primaryBlue);
        
        doc.fontSize(8.5)
           .font('Helvetica-Bold')
           .fillColor(colors.white)
           .text(
             pageText,
             doc.page.width - pageTextWidth - 50,
             doc.page.height - 33,
             { width: pageTextWidth, align: 'center' }
           );
        
        // Decorative corner element
        doc.circle(doc.page.width - 30, doc.page.height - 20, 8)
           .fillOpacity(0.05)
           .fill(colors.primaryOrange);
        doc.fillOpacity(1);
      }
      
      doc.end();
      
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          logger.info(`Empresas summary exported to PDF: ${filePath}`);
          resolve(filePath);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error(`Error exporting empresas to PDF: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Export rechequeos comprehensive report to PDF
   * @param {Object} summaryData - Summary data with KPIs and table data
   * @param {String} fileName - The name of the file (without extension)
   * @returns {String} - Path to the exported file
   */
  static async exportRechequeosComprehensiveToPDF(summaryData, fileName) {
    try {
      const exportDir = path.join(config.logging.directory, 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const filePath = path.join(exportDir, `${fileName}_${Date.now()}.pdf`);
      const doc = new PDFDocument({ 
        margin: 0,
        size: 'A4',
        bufferPages: true
      });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Modern Color Palette
      const colors = {
        primaryBlue: '#150773',
        secondaryBlue: '#1a0a8f',
        lightBlue: '#2d1db8',
        accentBlue: '#4a3fcc',
        primaryOrange: '#f5592b',
        lightOrange: '#ff7043',
        accentOrange: '#ffab91',
        white: '#FFFFFF',
        lightGray: '#f8f9fa',
        mediumGray: '#e9ecef',
        darkGray: '#495057',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        gradient1: '#150773',
        gradient2: '#2d1db8',
        cardShadow: 'rgba(21, 7, 115, 0.08)',
        successGreen: '#10b981',
        warningYellow: '#f59e0b',
        dangerRed: '#ef4444'
      };
      
      // Helper: Format date elegantly
      const formatDate = (dateStr) => {
        if (!dateStr) return 'No especificada';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };
      
      // Helper: Format number
      const formatNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        return num.toLocaleString('es-ES');
      };
      
      // Helper: Format percentage
      const formatPercentage = (num) => {
        if (num === null || num === undefined) return 'N/A';
        return `${num.toFixed(1)}%`;
      };
      
      // Helper: Draw modern header with diagonal accent
      const drawHeader = () => {
        // Gradient background
        doc.rect(0, 0, doc.page.width, 140)
           .fill(colors.primaryBlue);
        
        // Diagonal accent stripe (creates dynamic movement)
        doc.save();
        doc.polygon(
          [0, 120],
          [doc.page.width, 100],
          [doc.page.width, 140],
          [0, 140]
        ).fill(colors.secondaryBlue);
        doc.restore();
        
        // Orange accent line with glow effect
        doc.rect(0, 136, doc.page.width, 4).fill(colors.primaryOrange);
        doc.rect(0, 134, doc.page.width, 2).fillOpacity(0.3).fill(colors.primaryOrange);
        doc.fillOpacity(1);
        
        // Decorative circles (modern design element)
        doc.circle(doc.page.width - 50, 30, 60).fillOpacity(0.05).fill(colors.white);
        doc.circle(doc.page.width - 80, 70, 40).fillOpacity(0.03).fill(colors.white);
        doc.fillOpacity(1);
        
        // Title with modern typography
        doc.fillColor(colors.white)
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('RECHEQUEOS', 50, 35, { 
             align: 'left',
             characterSpacing: 1
           });
        
        // Subtitle with lighter weight
        doc.fontSize(11)
           .font('Helvetica')
           .fillOpacity(0.9)
           .text('Análisis de Evolución Digital - Empresas con Múltiples Chequeos', 50, 70, { align: 'left' });
        doc.fillOpacity(1);
        
        // Date range in modern card
        const rangoFechas = summaryData.fechaIni && summaryData.fechaFin
          ? `${formatDate(summaryData.fechaIni)} - ${formatDate(summaryData.fechaFin)}`
          : 'Todos los tiempos';
        
        // Obtener filtros activos
        const filters = summaryData.filters || {};
        const filtrosActivos = [];
        if (filters.departamento) filtrosActivos.push(`Dept: ${filters.departamento}`);
        if (filters.sector) filtrosActivos.push(`Sector: ${filters.sector}`);
        if (filters.tamano) filtrosActivos.push(`Tamaño: ${filters.tamano}`);
        if (filters.distrito) filtrosActivos.push(`Distrito: ${filters.distrito}`);
        
        // Ajustar altura del card si hay filtros adicionales
        const cardHeight = filtrosActivos.length > 0 ? 45 : 30;
        
        doc.roundedRect(50, 90, 250, cardHeight, 4)
           .fillOpacity(0.15)
           .fill(colors.white);
        doc.fillOpacity(1);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(colors.white)
           .fillOpacity(0.8)
           .text('PERIODO', 60, 96);
        doc.fillOpacity(1);
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(colors.white)
           .text(rangoFechas, 60, 107);
        
        // Mostrar filtros activos si existen
        if (filtrosActivos.length > 0) {
          doc.fontSize(8)
             .font('Helvetica')
             .fillColor(colors.white)
             .fillOpacity(0.85)
             .text(`Filtros: ${filtrosActivos.join(', ')}`, 60, 120, { 
               width: 240,
               ellipsis: true
             });
          doc.fillOpacity(1);
        }
        
        // Generation timestamp
        const fechaGeneracion = new Date().toLocaleString('es-ES', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        doc.fontSize(7)
           .font('Helvetica')
           .fillOpacity(0.7)
           .text(`Generado: ${fechaGeneracion}`, 310, 105, { align: 'left' });
        doc.fillOpacity(1);
        
        // Logos with modern placement (MIC primero, BID segundo)
        const logoBIDPath = path.join(__dirname, '../../../public/logoBID.png');
        const logoMICPath = path.join(__dirname, '../../../public/logoMIC.png');
        
        // Logo containers with subtle backgrounds
        doc.roundedRect(doc.page.width - 195, 25, 80, 80, 6)
           .fillOpacity(0.1)
           .fill(colors.white);
        doc.roundedRect(doc.page.width - 105, 25, 80, 80, 6)
           .fillOpacity(0.1)
           .fill(colors.white);
        doc.fillOpacity(1);
        
        try {
          if (fs.existsSync(logoMICPath)) {
            doc.image(logoMICPath, doc.page.width - 185, 35, { 
              width: 60, 
              height: 60, 
              fit: [60, 60] 
            });
          }
        } catch (e) {
          logger.warn(`Could not load MIC logo: ${e.message}`);
        }
        
        try {
          if (fs.existsSync(logoBIDPath)) {
            doc.image(logoBIDPath, doc.page.width - 95, 35, { 
              width: 60, 
              height: 60, 
              fit: [60, 60] 
            });
          }
        } catch (e) {
          logger.warn(`Could not load BID logo: ${e.message}`);
        }
      };
      
      // Helper: Draw section header with modern style
      const drawSectionHeader = (title, icon = null) => {
        // Orange accent bar
        doc.rect(50, doc.y, 5, 20)
           .fill(colors.primaryOrange);
        
        // Title
        doc.fillColor(colors.primaryBlue)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text(title, 65, doc.y + 3);
        
        doc.y += 22;
      };
      
      // Helper: Draw KPI card
      const drawKPICard = (x, y, width, height, title, value, subtitle = null, color = colors.primaryBlue) => {
        // Card background with subtle shadow
        doc.roundedRect(x + 2, y + 2, width, height, 8)
           .fillOpacity(0.05)
           .fill(colors.darkGray);
        
        doc.roundedRect(x, y, width, height, 8)
           .fillOpacity(1)
           .fill(colors.white);
        
        // Accent bar
        doc.roundedRect(x, y, width, 6, 8)
           .fill(color);
        
        // Title
        doc.fillColor(colors.textSecondary)
           .fontSize(9)
           .font('Helvetica')
           .text(title, x + 15, y + 18, { 
             width: width - 30,
             align: 'left' 
           });
        
        // Value
        doc.fillColor(color)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(value, x + 15, y + 35, { 
             width: width - 30,
             align: 'left' 
           });
        
        // Subtitle
        if (subtitle) {
          doc.fillColor(colors.textSecondary)
             .fontSize(8)
             .font('Helvetica')
             .text(subtitle, x + 15, y + 65, { 
               width: width - 30,
               align: 'left' 
             });
        }
      };
      
      // Helper: Draw footer
      const drawFooter = () => {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          
          // Orange line at bottom
          const footerY = doc.page.height - 20;
          doc.rect(0, footerY, doc.page.width, 1)
             .fill(colors.primaryOrange);
        }
      };
      
      // === PAGE 1: KPIs PRINCIPALES ===
      drawHeader();
      doc.y = 165;
      
      drawSectionHeader('RESUMEN EJECUTIVO');
      
      const kpis = summaryData.kpis || {};
      const cobertura = kpis.cobertura || {};
      const magnitud = kpis.magnitud || {};
      const velocidad = kpis.velocidad || {};
      const deltaPorDimension = magnitud.deltaPorDimension || {};
      const saltosNivel = magnitud.saltosNivel || {};
      
      // Contar empresas en la tabla de datos
      const totalEmpresas = summaryData.tableData ? summaryData.tableData.length : 0;
      
      // Calcular total de chequeos sumando TotalChequeos de cada empresa
      const totalChequeos = summaryData.tableData 
        ? summaryData.tableData.reduce((sum, row) => sum + (row.TotalChequeos || 0), 0)
        : 0;
      
      // Row 1: 4 KPIs principales en fila horizontal uniforme
      const cardWidth = 115;
      const cardHeight = 75;
      const cardGap = 10;
      const startX = 50;
      const baseY = doc.y;
      
      drawKPICard(startX, baseY, cardWidth, cardHeight, 
        'Total Empresas', 
        formatNumber(totalEmpresas),
        'con 2+ chequeos',
        colors.primaryBlue
      );
      
      drawKPICard(startX + cardWidth + cardGap, baseY, cardWidth, cardHeight, 
        'Total Chequeos', 
        formatNumber(totalChequeos),
        'completados',
        colors.primaryOrange
      );
      
      drawKPICard(startX + (cardWidth + cardGap) * 2, baseY, cardWidth, cardHeight, 
        'Avg. Chequeos', 
        (cobertura.promChequeosPorEmpresa || 0).toFixed(1),
        'por empresa',
        colors.accentBlue
      );
      
      drawKPICard(startX + (cardWidth + cardGap) * 3, baseY, cardWidth, cardHeight, 
        'Mejora Global', 
        formatPercentage(magnitud.deltaGlobalProm || 0),
        'promedio',
        (magnitud.deltaGlobalProm || 0) > 0 ? colors.successGreen : colors.dangerRed
      );
      
      doc.y = baseY + cardHeight + 20;
      
      // Row 2: Deltas por dimensión
      drawSectionHeader('EVOLUCIÓN POR DIMENSIÓN');
      
      const dimensions = [
        { name: 'Tecnología', value: deltaPorDimension['Tecnología'] || 0 },
        { name: 'Comunicación', value: deltaPorDimension['Comunicación'] || 0 },
        { name: 'Organización', value: deltaPorDimension['Organización'] || 0 },
        { name: 'Datos', value: deltaPorDimension['Datos'] || 0 },
        { name: 'Estrategia', value: deltaPorDimension['Estrategia'] || 0 },
        { name: 'Procesos', value: deltaPorDimension['Procesos'] || 0 }
      ];
      
      const dimCardWidth = 95;
      const dimCardHeight = 60;
      const dimGap = 8;
      const dimStartX = 50;
      const dimBaseY = doc.y;
      
      // 2 filas de 3 cards cada una
      dimensions.forEach((dim, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = dimStartX + col * (dimCardWidth + dimGap);
        const y = dimBaseY + row * (dimCardHeight + 8);
        
        const deltaColor = dim.value > 0 ? colors.successGreen : 
                          dim.value < 0 ? colors.dangerRed : colors.darkGray;
        
        // Card
        doc.roundedRect(x, y, dimCardWidth, dimCardHeight, 6)
           .fillOpacity(1)
           .fill(colors.lightGray);
        
        // Dimension name
        doc.fillColor(colors.primaryBlue)
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text(dim.name, x + 8, y + 10, { 
             width: dimCardWidth - 16,
             align: 'center' 
           });
        
        // Delta value
        doc.fillColor(deltaColor)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(formatPercentage(dim.value), x + 8, y + 28, { 
             width: dimCardWidth - 16,
             align: 'center' 
           });
      });
      
      doc.y = dimBaseY + (dimCardHeight * 2) + 16 + 15;
      
      // Additional KPIs
      drawSectionHeader('INDICADORES DE SALTO');
      
      const smallCardWidth = 155;
      const smallCardHeight = 60;
      const smallGap = 10;
      const smallBaseY = doc.y;
      
      drawKPICard(50, smallBaseY, smallCardWidth, smallCardHeight, 
        'Saltos Bajo -> Medio', 
        formatNumber(saltosNivel.bajo_medio || 0),
        'empresas',
        colors.warningYellow
      );
      
      drawKPICard(50 + smallCardWidth + smallGap, smallBaseY, smallCardWidth, smallCardHeight, 
        'Saltos Medio -> Alto', 
        formatNumber(saltosNivel.medio_alto || 0),
        'empresas',
        colors.successGreen
      );
      
      drawKPICard(50 + (smallCardWidth + smallGap) * 2, smallBaseY, smallCardWidth, smallCardHeight, 
        'Tasa Mejora Mensual', 
        formatPercentage(velocidad.tasaMejoraMensual || 0),
        'promedio',
        colors.primaryOrange
      );
      
      doc.y = smallBaseY + smallCardHeight + 20;
      
      // === PAGE 2: TABLA DE EMPRESAS ===
      doc.addPage();
      drawHeader();
      doc.y = 165;
      
      drawSectionHeader('EMPRESAS CON RECHEQUEOS');
      
      const tableData = summaryData.tableData || [];
      
      if (tableData.length > 0) {
        // Table configuration - tabla completa y profesional
        const tableStartX = 40;
        const tableWidth = doc.page.width - 80;
        const rowHeight = 15;
        const headerHeight = 22;
        
        // Define column widths (optimizados para tabla completa)
        const colWidths = {
          empresa: 125,
          sector: 75,
          totalChequeos: 32,
          primeraFecha: 50,
          ultimaFecha: 50,
          dias: 35,
          puntajeInicial: 40,
          puntajeFinal: 40,
          deltaGlobal: 45,
          niveles: 60
        };
        
        const totalColWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
        
        // Header background con borde
        doc.rect(tableStartX, doc.y, tableWidth, headerHeight)
           .fill(colors.primaryBlue);
        
        // Borde del header
        doc.rect(tableStartX, doc.y, tableWidth, headerHeight)
           .lineWidth(0.5)
           .strokeColor(colors.primaryBlue)
           .stroke();
        
        // Header text
        doc.fillColor(colors.white)
           .fontSize(7)
           .font('Helvetica-Bold');
        
        let currentX = tableStartX + 3;
        const headerY = doc.y + 7;
        
        doc.text('Empresa', currentX, headerY, { width: colWidths.empresa - 3 });
        currentX += colWidths.empresa;
        doc.text('Sector', currentX, headerY, { width: colWidths.sector - 3 });
        currentX += colWidths.sector;
        doc.text('N°', currentX, headerY, { width: colWidths.totalChequeos, align: 'center' });
        currentX += colWidths.totalChequeos;
        doc.text('Primera', currentX, headerY, { width: colWidths.primeraFecha, align: 'center' });
        currentX += colWidths.primeraFecha;
        doc.text('Ultima', currentX, headerY, { width: colWidths.ultimaFecha, align: 'center' });
        currentX += colWidths.ultimaFecha;
        doc.text('Dias', currentX, headerY, { width: colWidths.dias, align: 'center' });
        currentX += colWidths.dias;
        doc.text('P. Inic', currentX, headerY, { width: colWidths.puntajeInicial, align: 'center' });
        currentX += colWidths.puntajeInicial;
        doc.text('P. Final', currentX, headerY, { width: colWidths.puntajeFinal, align: 'center' });
        currentX += colWidths.puntajeFinal;
        doc.text('Delta', currentX, headerY, { width: colWidths.deltaGlobal, align: 'center' });
        currentX += colWidths.deltaGlobal;
        doc.text('Niveles', currentX, headerY, { width: colWidths.niveles, align: 'center' });
        
        doc.y += headerHeight;
        
        // Table rows (limited to fit on page - ya viene limitado del backend)
        const maxRows = Math.min(30, tableData.length); // Máximo 30 filas por página
        const limitedData = tableData.slice(0, maxRows);
        
        limitedData.forEach((row, index) => {
          const bgColor = index % 2 === 0 ? colors.white : colors.lightGray;
          
          // Check if we need a new page
          if (doc.y + rowHeight > doc.page.height - 35) {
            doc.addPage();
            drawHeader();
            doc.y = 165;
            drawSectionHeader('EMPRESAS CON RECHEQUEOS (continuación)');
            
            // Redibujar header en nueva página
            doc.rect(tableStartX, doc.y, tableWidth, headerHeight)
               .fill(colors.primaryBlue);
            doc.rect(tableStartX, doc.y, tableWidth, headerHeight)
               .lineWidth(0.5)
               .strokeColor(colors.primaryBlue)
               .stroke();
            
            doc.fillColor(colors.white)
               .fontSize(7)
               .font('Helvetica-Bold');
            
            let headerX = tableStartX + 3;
            const headerYPos = doc.y + 7;
            doc.text('Empresa', headerX, headerYPos, { width: colWidths.empresa - 3 });
            headerX += colWidths.empresa;
            doc.text('Sector', headerX, headerYPos, { width: colWidths.sector - 3 });
            headerX += colWidths.sector;
            doc.text('N°', headerX, headerYPos, { width: colWidths.totalChequeos, align: 'center' });
            headerX += colWidths.totalChequeos;
            doc.text('Primera', headerX, headerYPos, { width: colWidths.primeraFecha, align: 'center' });
            headerX += colWidths.primeraFecha;
            doc.text('Ultima', headerX, headerYPos, { width: colWidths.ultimaFecha, align: 'center' });
            headerX += colWidths.ultimaFecha;
            doc.text('Dias', headerX, headerYPos, { width: colWidths.dias, align: 'center' });
            headerX += colWidths.dias;
            doc.text('P. Inic', headerX, headerYPos, { width: colWidths.puntajeInicial, align: 'center' });
            headerX += colWidths.puntajeInicial;
            doc.text('P. Final', headerX, headerYPos, { width: colWidths.puntajeFinal, align: 'center' });
            headerX += colWidths.puntajeFinal;
            doc.text('Delta', headerX, headerYPos, { width: colWidths.deltaGlobal, align: 'center' });
            headerX += colWidths.deltaGlobal;
            doc.text('Niveles', headerX, headerYPos, { width: colWidths.niveles, align: 'center' });
            
            doc.y += headerHeight;
          }
          
          // Posición Y fija para esta fila
          const rowY = doc.y;
          
          // Row background
          doc.rect(tableStartX, rowY, tableWidth, rowHeight)
             .fill(bgColor);
          
          // Borde de la fila
          doc.rect(tableStartX, rowY, tableWidth, rowHeight)
             .lineWidth(0.3)
             .strokeColor(colors.mediumGray)
             .stroke();
          
          // Row text
          doc.fillColor(colors.textPrimary)
             .fontSize(6.5)
             .font('Helvetica');
          
          // Posición Y fija para el texto (centrado verticalmente)
          const textY = rowY + (rowHeight / 2) - 1.5;
          
          currentX = tableStartX + 3;
          
          // Empresa
          const empresaNombre = (row.EmpresaNombre || 'N/A').trim();
          const empresaTruncada = empresaNombre.length > 24 ? empresaNombre.substring(0, 21) + '...' : empresaNombre;
          doc.text(empresaTruncada, currentX, textY, { width: colWidths.empresa - 3 });
          currentX += colWidths.empresa;
          
          // Sector
          const sector = (row.SectorActividad || 'N/A').trim();
          const sectorTruncado = sector.length > 16 ? sector.substring(0, 13) + '...' : sector;
          doc.text(sectorTruncado, currentX, textY, { width: colWidths.sector - 3 });
          currentX += colWidths.sector;
          
          // Total Chequeos
          doc.font('Helvetica-Bold')
             .text(String(row.TotalChequeos || 0), currentX, textY, { 
               width: colWidths.totalChequeos, 
               align: 'center' 
             });
          currentX += colWidths.totalChequeos;
          
          // Primera Fecha (formato: DD/MM/YYYY - mantener año completo)
          let primeraFecha = row.PrimeraFechaFormatted || row.PrimeraFecha || 'N/A';
          // Si viene como string "DD/MM/YYYY", mantenerlo completo
          // Si viene como Date object, formatearlo
          if (primeraFecha !== 'N/A' && !primeraFecha.includes('/')) {
            try {
              const fecha = new Date(primeraFecha);
              primeraFecha = fecha.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              });
            } catch (e) {
              primeraFecha = 'N/A';
            }
          }
          // Asegurar formato DD/MM/YYYY (10 caracteres) - no truncar
          doc.font('Helvetica')
             .text(primeraFecha, currentX, textY, { 
               width: colWidths.primeraFecha, 
               align: 'center' 
             });
          currentX += colWidths.primeraFecha;
          
          // Última Fecha (formato: DD/MM/YYYY - mantener año completo)
          let ultimaFecha = row.UltimaFechaFormatted || row.UltimaFecha || 'N/A';
          // Si viene como string "DD/MM/YYYY", mantenerlo completo
          // Si viene como Date object, formatearlo
          if (ultimaFecha !== 'N/A' && !ultimaFecha.includes('/')) {
            try {
              const fecha = new Date(ultimaFecha);
              ultimaFecha = fecha.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              });
            } catch (e) {
              ultimaFecha = 'N/A';
            }
          }
          // Asegurar formato DD/MM/YYYY (10 caracteres) - no truncar
          doc.text(ultimaFecha, currentX, textY, { 
            width: colWidths.ultimaFecha, 
            align: 'center' 
          });
          currentX += colWidths.ultimaFecha;
          
          // Días entre chequeos
          doc.text(String(row.DiasEntreChequeos || 0), currentX, textY, { 
            width: colWidths.dias, 
            align: 'center' 
          });
          currentX += colWidths.dias;
          
          // Puntaje Inicial
          const puntajeInicial = row.PrimerPuntaje || 0;
          doc.text(formatPercentage(puntajeInicial), currentX, textY, { 
            width: colWidths.puntajeInicial, 
            align: 'center' 
          });
          currentX += colWidths.puntajeInicial;
          
          // Puntaje Final
          const puntajeFinal = row.UltimoPuntaje || 0;
          doc.text(formatPercentage(puntajeFinal), currentX, textY, { 
            width: colWidths.puntajeFinal, 
            align: 'center' 
          });
          currentX += colWidths.puntajeFinal;
          
          // Delta Global (con color)
          const delta = row.DeltaGlobal || 0;
          const deltaColor = delta > 0 ? colors.successGreen : 
                            delta < 0 ? colors.dangerRed : colors.darkGray;
          doc.fillColor(deltaColor)
             .font('Helvetica-Bold')
             .fontSize(6.5)
             .text(formatPercentage(delta), currentX, textY, { 
               width: colWidths.deltaGlobal, 
               align: 'center' 
             });
          currentX += colWidths.deltaGlobal;
          
          // Niveles (usar flecha ASCII simple en lugar de →)
          doc.fillColor(colors.textPrimary)
             .font('Helvetica')
             .fontSize(6);
          const abrevNivel = (nivel) => {
            if (!nivel) return '?';
            const nivelLower = nivel.toLowerCase();
            if (nivelLower.includes('inic')) return 'Inic';
            if (nivelLower.includes('nov')) return 'Nov';
            if (nivelLower.includes('comp')) return 'Comp';
            if (nivelLower.includes('avan')) return 'Avan';
            return nivel.substring(0, 4);
          };
          // Usar "->" en lugar de "→" para evitar caracteres inválidos
          const niveles = `${abrevNivel(row.PrimerNivel)} -> ${abrevNivel(row.UltimoNivel)}`;
          doc.text(niveles, currentX, textY, { 
            width: colWidths.niveles, 
            align: 'center' 
          });
          
          // Avanzar Y
          doc.y = rowY + rowHeight;
        });
        
        // Note if data was truncated
        if (tableData.length > maxRows) {
          doc.y += 10;
          doc.fillColor(colors.textSecondary)
             .fontSize(9)
             .font('Helvetica-Oblique')
             .text(`* Mostrando ${maxRows} de ${tableData.length} empresas. Exporta CSV para ver todos los datos.`, 
                   50, doc.y, { align: 'center', width: doc.page.width - 100 });
        }
      } else {
        doc.fillColor(colors.textSecondary)
           .fontSize(12)
           .font('Helvetica')
           .text('No hay datos disponibles para el período seleccionado.', 
                 50, doc.y + 50, { align: 'center', width: doc.page.width - 100 });
      }
      
      // Draw footer on all pages
      drawFooter();
      
      // Finalize PDF
      doc.end();
      
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          logger.info(`Rechequeos PDF exported successfully: ${filePath}`);
          resolve(filePath);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error(`Error exporting rechequeos to PDF: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }
}

module.exports = Exporter;
