"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentData = void 0;
exports.EquipmentData = {
    /**
     * Dados dos tanques
     */
    tanks: [
        {
            id: "TQ-0001",
            name: "Tanque de Diesel S10 Principal",
            type: "tank", // Adicionado tipo base
            equipmentType: "large",
            position: { x: -15, y: 0, z: -10 },
            product: "Diesel S10",
            capacity: 5000,
            level: 0.85,
            temperature: 25.3,
            status: "operational",
            parentId: "AREA-01", // Exemplo de hierarquia
            tags: ["diesel", "armazenamento", "principal"],
            metadata: {
                lastInspection: "2023-06-15",
                manufacturer: "Petrobras Equipamentos",
                yearBuilt: 2018,
                material: "Aço Carbono",
                coating: "Epóxi interno",
                roofType: "Teto fixo",
                mixers: true,
                heatingSystem: false
            },
            documentationUrl: "http://example.com/docs/TQ-0001"
        },
        {
            id: "TQ-0002",
            name: "Tanque de Gasolina",
            type: "tank",
            equipmentType: "standard",
            position: { x: -8, y: 0, z: -10 },
            product: "Gasolina",
            capacity: 3000,
            level: 0.65,
            temperature: 22.8,
            status: "operational",
            parentId: "AREA-01",
            tags: ["gasolina", "armazenamento"],
            metadata: {
                lastInspection: "2023-04-10",
                manufacturer: "Petrobras Equipamentos",
                yearBuilt: 2019,
                material: "Aço Carbono",
                coating: "Epóxi interno",
                roofType: "Teto flutuante",
                mixers: false,
                heatingSystem: false
            }
        },
        {
            id: "TQ-0003",
            name: "Tanque de Diesel Marítimo",
            type: "tank",
            equipmentType: "standard",
            position: { x: -1, y: 0, z: -10 },
            product: "Diesel Marítimo",
            capacity: 3000,
            level: 0.45,
            temperature: 23.5,
            status: "maintenance",
            parentId: "AREA-01",
            tags: ["diesel", "marítimo", "armazenamento"],
            metadata: {
                lastInspection: "2022-11-22",
                maintenanceInfo: {
                    startDate: "2023-10-25",
                    estimatedEndDate: "2023-11-10",
                    type: "Inspeção interna",
                    responsible: "Equipe de Manutenção T3"
                },
                manufacturer: "Petrobras Equipamentos",
                yearBuilt: 2017,
                material: "Aço Carbono",
                coating: "Epóxi interno",
                roofType: "Teto fixo",
                mixers: true,
                heatingSystem: false
            }
        },
        {
            id: "TQ-0004",
            name: "Tanque de Óleo Lubrificante",
            type: "tank",
            equipmentType: "small",
            position: { x: 6, y: 0, z: -10 },
            product: "Óleo Lubrificante",
            capacity: 1000,
            level: 0.75,
            temperature: 35.2,
            status: "operational",
            parentId: "AREA-02",
            tags: ["óleo", "lubrificante", "armazenamento"],
            metadata: {
                lastInspection: "2023-02-18",
                manufacturer: "TecTanques",
                yearBuilt: 2020,
                material: "Aço Inox",
                coating: "N/A",
                roofType: "Teto fixo",
                mixers: true,
                heatingSystem: true
            }
        },
        {
            id: "TQ-0005",
            name: "Tanque de GLP",
            type: "tank",
            equipmentType: "spherical",
            position: { x: 13, y: 0, z: -10 },
            product: "GLP",
            capacity: 2000,
            level: 0.55,
            temperature: 18.6,
            status: "operational",
            parentId: "AREA-02",
            tags: ["glp", "gás", "armazenamento"],
            metadata: {
                pressure: 12.5,
                lastInspection: "2023-01-05",
                manufacturer: "EsferoTech",
                yearBuilt: 2016,
                material: "Aço Especial P355NL1",
                coating: "Anticorrosivo externo",
                pressureRating: "16 bar",
                safetyValves: 4,
                coolingSystem: true
            }
        },
        {
            id: "TQ-0006",
            name: "Tanque de Água Incêndio",
            type: "tank",
            equipmentType: "small",
            position: { x: -20, y: 0, z: -5 },
            product: "Água",
            capacity: 1000,
            level: 0.90,
            status: "operational",
            parentId: "AREA-UTILIDADES",
            tags: ["água", "incêndio", "segurança"],
            metadata: {
                purpose: "Sistema de combate a incêndio",
                manufacturer: "AguaTech",
                yearBuilt: 2018,
                material: "Aço Carbono",
                coating: "Epóxi interno e externo",
                pumpSystem: true
            }
        },
        {
            id: "TQ-0007",
            name: "Tanque de Etanol",
            type: "tank",
            equipmentType: "standard",
            position: { x: -20, y: 0, z: -15 },
            product: "Etanol",
            capacity: 2500,
            level: 0.30,
            temperature: 21.4,
            status: "offline",
            parentId: "AREA-01",
            tags: ["etanol", "álcool", "armazenamento"],
            metadata: {
                lastInspection: "2022-08-15",
                manufacturer: "Petrobras Equipamentos",
                yearBuilt: 2015,
                material: "Aço Carbono",
                coating: "Epóxi especial para álcool",
                roofType: "Teto flutuante interno",
                mixers: false,
                heatingSystem: false
            }
        }
    ],
    /**
     * Dados das tubulações
     */
    pipes: [
        {
            id: "PIPE-MAIN-01",
            name: "Linha Principal de Diesel",
            type: "pipe",
            size: "large",
            materialType: "standard",
            product: "Diesel S10",
            status: "operational",
            parentId: "SISTEMA-DIESEL",
            tags: ["diesel", "principal", "transferência"],
            points: [
                { x: -15, y: 0.5, z: -5 },
                { x: -15, y: 0.5, z: 5 },
                { x: 15, y: 0.5, z: 5 }
            ],
            connectedTo: { start: "TQ-0001", end: "AREA-CARGA-CAMINHAO" }, // Exemplo
            metadata: {
                diameter: 12, // polegadas
                pressure: 6.5, // bar
                flowRate: 350, // m³/h
                material: "Aço Carbono",
                schedule: "40",
                insulation: false,
                heatTracing: false,
                yearInstalled: 2018
            }
        },
        {
            id: "PIPE-CONN-01",
            name: "Conexão Tanque Diesel S10",
            type: "pipe",
            size: "medium",
            materialType: "standard",
            product: "Diesel S10",
            status: "operational",
            parentId: "SISTEMA-DIESEL",
            tags: ["diesel", "conexão", "tanque"],
            points: [
                { x: -15, y: 0.5, z: -5 },
                { x: -15, y: 0.5, z: -8 },
                { x: -15, y: 0.5, z: -10 }
            ],
            connectedTo: { start: "PIPE-MAIN-01", end: "TQ-0001" },
            metadata: {
                diameter: 8, // polegadas
                pressure: 5.8, // bar
                flowRate: 150, // m³/h
                material: "Aço Carbono",
                schedule: "40",
                insulation: false,
                heatTracing: false,
                yearInstalled: 2018
            }
        },
        {
            id: "PIPE-CONN-02",
            name: "Conexão Tanque Gasolina",
            type: "pipe",
            size: "medium",
            materialType: "standard",
            product: "Gasolina",
            status: "operational",
            parentId: "SISTEMA-GASOLINA",
            tags: ["gasolina", "conexão", "tanque"],
            points: [
                { x: -8, y: 0.5, z: 5 },
                { x: -8, y: 0.5, z: -10 }
            ],
            connectedTo: { start: "PIPE-MAIN-GAS", end: "TQ-0002" }, // Supondo PIPE-MAIN-GAS
            metadata: {
                diameter: 8, // polegadas
                pressure: 5.2, // bar
                flowRate: 120, // m³/h
                material: "Aço Carbono",
                schedule: "40",
                insulation: false,
                heatTracing: false,
                yearInstalled: 2019
            }
        },
        {
            id: "PIPE-CONN-03",
            name: "Conexão Tanque Diesel Marítimo",
            type: "pipe",
            size: "medium",
            materialType: "standard",
            product: "Diesel Marítimo",
            status: "maintenance",
            parentId: "SISTEMA-DIESEL-MAR",
            tags: ["diesel", "marítimo", "conexão", "tanque"],
            points: [
                { x: -1, y: 0.5, z: 5 },
                { x: -1, y: 0.5, z: -10 }
            ],
            connectedTo: { start: "PIPE-MAIN-MAR", end: "TQ-0003" }, // Supondo PIPE-MAIN-MAR
            metadata: {
                diameter: 8, // polegadas
                pressure: 5.5, // bar
                flowRate: 0, // m³/h (em manutenção)
                material: "Aço Carbono",
                schedule: "40",
                insulation: false,
                heatTracing: false,
                yearInstalled: 2017
            }
        },
        {
            id: "PIPE-CONN-04",
            name: "Conexão Tanque Óleo Lubrificante",
            type: "pipe",
            size: "small",
            materialType: "standard",
            product: "Óleo Lubrificante",
            status: "operational",
            parentId: "SISTEMA-LUB",
            tags: ["óleo", "lubrificante", "conexão", "tanque"],
            points: [
                { x: 6, y: 0.5, z: 5 },
                { x: 6, y: 0.5, z: -10 }
            ],
            connectedTo: { start: "PIPE-MAIN-LUB", end: "TQ-0004" }, // Supondo PIPE-MAIN-LUB
            metadata: {
                diameter: 4, // polegadas
                pressure: 4.8, // bar
                flowRate: 30, // m³/h
                material: "Aço Inox",
                schedule: "40",
                insulation: true,
                heatTracing: true,
                yearInstalled: 2020
            }
        },
        {
            id: "PIPE-HIGHTEMP-01",
            name: "Linha de Vapor",
            type: "pipe",
            size: "medium",
            materialType: "highTemp",
            product: "Vapor",
            status: "operational",
            parentId: "SISTEMA-UTILIDADES",
            tags: ["vapor", "utilidades", "alta temperatura"],
            points: [
                { x: 15, y: 0.5, z: -8 },
                { x: 15, y: 0.5, z: 5 },
                { x: 15, y: 0.5, z: 10 }
            ],
            metadata: {
                diameter: 6, // polegadas
                pressure: 8.5, // bar
                temperature: 180, // °C
                material: "Aço Liga",
                schedule: "80",
                insulation: true,
                heatTracing: false,
                yearInstalled: 2018
            }
        },
        {
            id: "PIPE-INSUL-01",
            name: "Linha de GLP",
            type: "pipe",
            size: "small",
            materialType: "insulated",
            product: "GLP",
            status: "operational",
            parentId: "SISTEMA-GLP",
            tags: ["glp", "gás", "transferência"],
            points: [
                { x: 13, y: 0.5, z: -10 },
                { x: 13, y: 0.5, z: 0 },
                { x: 10, y: 0.5, z: 0 },
                { x: 10, y: 0.5, z: 10 }
            ],
            connectedTo: { start: "TQ-0005", end: "AREA-CARGA-GLP" },
            metadata: {
                diameter: 4, // polegadas
                pressure: 12.5, // bar
                temperature: 18.6, // °C
                material: "Aço Especial",
                schedule: "80",
                insulation: true,
                heatTracing: false,
                yearInstalled: 2016
            }
        },
        {
            id: "PIPE-ELEV-01",
            name: "Linha Elevada de Água Incêndio",
            type: "pipe",
            size: "medium",
            materialType: "standard",
            product: "Água",
            status: "operational",
            parentId: "SISTEMA-INCENDIO",
            tags: ["água", "incêndio", "segurança", "elevada"],
            points: [
                { x: -10, y: 0.5, z: 8 },
                { x: -10, y: 4, z: 8 },
                { x: 5, y: 4, z: 8 },
                { x: 5, y: 0.5, z: 8 }
            ],
            connectedTo: { start: "TQ-0006", end: "HIDRANTE-05" },
            metadata: {
                diameter: 8, // polegadas
                pressure: 6.0, // bar
                material: "Aço Carbono",
                schedule: "40",
                insulation: false,
                heatTracing: false,
                purpose: "Sistema de combate a incêndio",
                yearInstalled: 2018
            }
        }
    ],
    /**
     * Dados das válvulas
     */
    valves: [
        {
            id: "XV-1001",
            name: "Válvula de Bloqueio Principal Diesel",
            type: "valve",
            valveType: "gate",
            position: { x: -15, y: 0.5, z: 0 },
            state: "open",
            parentId: "PIPE-MAIN-01",
            tags: ["válvula", "bloqueio", "diesel", "manual"],
            connectedPipe: "PIPE-MAIN-01",
            metadata: {
                product: "Diesel S10",
                diameter: 12, // polegadas
                pressure: 6.5, // bar
                lastMaintenance: "2023-07-10",
                manufacturer: "ValveTech",
                model: "GT-1200",
                material: "Aço Carbono",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "XV-1002",
            name: "Válvula de Bloqueio Intermediária Diesel",
            type: "valve",
            valveType: "gate",
            position: { x: -5, y: 0.5, z: 5 },
            state: "open",
            parentId: "PIPE-MAIN-01",
            tags: ["válvula", "bloqueio", "diesel", "manual"],
            connectedPipe: "PIPE-MAIN-01",
            metadata: {
                product: "Diesel S10",
                diameter: 12, // polegadas
                pressure: 6.3, // bar
                lastMaintenance: "2023-06-22",
                manufacturer: "ValveTech",
                model: "GT-1200",
                material: "Aço Carbono",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "XV-1003",
            name: "Válvula de Bloqueio Final Diesel",
            type: "valve",
            valveType: "gate",
            position: { x: 5, y: 0.5, z: 5 },
            state: "closed",
            parentId: "PIPE-MAIN-01",
            tags: ["válvula", "bloqueio", "diesel", "manual"],
            connectedPipe: "PIPE-MAIN-01",
            metadata: {
                product: "Diesel S10",
                diameter: 12, // polegadas
                pressure: 0, // bar (fechada)
                lastMaintenance: "2023-08-05",
                manufacturer: "ValveTech",
                model: "GT-1200",
                material: "Aço Carbono",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "FV-1001",
            name: "Válvula de Controle de Fluxo Diesel",
            type: "valve",
            valveType: "control",
            position: { x: -10, y: 0.5, z: -8 },
            state: "partial",
            parentId: "PIPE-CONN-01", // Conectada à linha de conexão
            tags: ["válvula", "controle", "fluxo", "diesel", "elétrica"],
            connectedPipe: "PIPE-CONN-01",
            metadata: {
                openPercentage: 45,
                product: "Diesel S10",
                diameter: 8, // polegadas
                pressure: 5.8, // bar
                flowRate: 75, // m³/h
                lastMaintenance: "2023-05-18",
                manufacturer: "FlowControl",
                model: "FC-800",
                material: "Aço Inox",
                actuationType: "Elétrico",
                controlSystem: "PID",
                yearInstalled: 2018
            }
        },
        {
            id: "FV-1002",
            name: "Válvula de Controle de Fluxo Diesel Marítimo",
            type: "valve",
            valveType: "control",
            position: { x: 0, y: 0.5, z: -8 },
            state: "open",
            parentId: "PIPE-CONN-03",
            tags: ["válvula", "controle", "fluxo", "diesel", "marítimo", "elétrica"],
            connectedPipe: "PIPE-CONN-03",
            metadata: {
                openPercentage: 100,
                product: "Diesel Marítimo",
                diameter: 8, // polegadas
                pressure: 5.5, // bar
                flowRate: 150, // m³/h
                lastMaintenance: "2023-04-12",
                manufacturer: "FlowControl",
                model: "FC-800",
                material: "Aço Inox",
                actuationType: "Elétrico",
                controlSystem: "PID",
                yearInstalled: 2017
            }
        },
        {
            id: "RV-1001",
            name: "Válvula de Retenção Linha Gasolina",
            type: "valve",
            valveType: "check",
            position: { x: -8, y: 0.5, z: 0 },
            rotation: { y: Math.PI / 2 },
            state: "open", // Estado aqui pode indicar fluxo passando
            parentId: "PIPE-CONN-02",
            tags: ["válvula", "retenção", "gasolina"],
            connectedPipe: "PIPE-CONN-02",
            metadata: {
                product: "Gasolina",
                diameter: 8, // polegadas
                pressure: 5.2, // bar
                lastMaintenance: "2023-03-25",
                manufacturer: "CheckValve Inc.",
                model: "CV-800",
                material: "Aço Carbono",
                checkType: "Portinhola",
                springLoaded: true,
                yearInstalled: 2019
            }
        },
        {
            id: "RV-1002",
            name: "Válvula de Retenção Linha Óleo",
            type: "valve",
            valveType: "check",
            position: { x: 8, y: 0.5, z: 0 },
            rotation: { y: Math.PI / 2 },
            state: "open",
            parentId: "PIPE-CONN-04",
            tags: ["válvula", "retenção", "óleo", "lubrificante"],
            connectedPipe: "PIPE-CONN-04",
            metadata: {
                product: "Óleo Lubrificante",
                diameter: 4, // polegadas
                pressure: 4.8, // bar
                lastMaintenance: "2023-02-15",
                manufacturer: "CheckValve Inc.",
                model: "CV-400",
                material: "Aço Inox",
                checkType: "Portinhola",
                springLoaded: true,
                yearInstalled: 2020
            }
        },
        {
            id: "BV-1001",
            name: "Válvula Esférica Linha Água",
            type: "valve",
            valveType: "ball",
            position: { x: -12, y: 0.5, z: 8 },
            state: "open",
            parentId: "PIPE-ELEV-01",
            tags: ["válvula", "esfera", "água", "incêndio", "manual"],
            connectedPipe: "PIPE-ELEV-01",
            metadata: {
                product: "Água",
                diameter: 8, // polegadas
                pressure: 6.0, // bar
                lastMaintenance: "2023-08-20",
                manufacturer: "BallValve Co.",
                model: "BV-800",
                material: "Aço Carbono",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "BV-1002",
            name: "Válvula Esférica Linha Água 2",
            type: "valve",
            valveType: "ball",
            position: { x: 0, y: 0.5, z: 8 },
            state: "closed",
            parentId: "PIPE-ELEV-01",
            tags: ["válvula", "esfera", "água", "incêndio", "manual"],
            connectedPipe: "PIPE-ELEV-01",
            metadata: {
                product: "Água",
                diameter: 8, // polegadas
                pressure: 0, // bar
                lastMaintenance: "2023-08-21",
                manufacturer: "BallValve Co.",
                model: "BV-800",
                material: "Aço Carbono",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "BFV-1001",
            name: "Válvula Borboleta Linha Água",
            type: "valve",
            valveType: "butterfly",
            position: { x: 10, y: 0.5, z: 8 },
            state: "partial",
            parentId: "PIPE-ELEV-01",
            tags: ["válvula", "borboleta", "água", "incêndio", "manual"],
            connectedPipe: "PIPE-ELEV-01",
            metadata: {
                openPercentage: 60,
                product: "Água",
                diameter: 8, // polegadas
                pressure: 6.0, // bar
                lastMaintenance: "2023-07-15",
                manufacturer: "Butterfly Valves Ltd.",
                model: "BFV-800",
                material: "Ferro Fundido",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "XV-1004",
            name: "Válvula de Bloqueio Vapor",
            type: "valve",
            valveType: "gate",
            position: { x: 15, y: 0.5, z: -5 },
            state: "maintenance",
            parentId: "PIPE-HIGHTEMP-01",
            tags: ["válvula", "bloqueio", "vapor", "manual", "manutenção"],
            connectedPipe: "PIPE-HIGHTEMP-01",
            metadata: {
                product: "Vapor",
                diameter: 6, // polegadas
                pressure: 8.5, // bar
                lastMaintenance: "2023-10-27",
                manufacturer: "ValveTech",
                model: "GT-600-HT",
                material: "Aço Liga",
                actuationType: "Manual",
                yearInstalled: 2018
            }
        },
        {
            id: "XV-1005",
            name: "Válvula de Bloqueio GLP",
            type: "valve",
            valveType: "gate",
            position: { x: 15, y: 0.5, z: 0 },
            state: "fault",
            parentId: "PIPE-INSUL-01",
            tags: ["válvula", "bloqueio", "glp", "manual", "falha"],
            connectedPipe: "PIPE-INSUL-01",
            metadata: {
                product: "GLP",
                diameter: 4, // polegadas
                pressure: 12.5, // bar
                lastMaintenance: "2023-09-10",
                faultDescription: "Vazamento na gaxeta",
                manufacturer: "ValveTech",
                model: "GT-400-LP",
                material: "Aço Especial",
                actuationType: "Manual",
                yearInstalled: 2016
            }
        }
    ],
    /**
     * Dados das áreas de carregamento
     */
    loadingAreas: [
        {
            id: "LA-TRUCK-01",
            name: "Plataforma de Carregamento Caminhões 1",
            type: "loadingArea",
            areaType: "truck",
            position: { x: 20, y: 0, z: 5 },
            status: "operational",
            parentId: "AREA-CARGA-CAMINHAO",
            tags: ["carregamento", "caminhão", "diesel", "gasolina"],
            metadata: {
                numberOfBays: 4,
                productsAvailable: ["Diesel S10", "Gasolina"],
                flowMeters: ["FM-2001", "FM-2002", "FM-2003", "FM-2004"],
                safetySystems: ["Aterramento", "Detecção de transbordo", "Chuveiro de emergência"]
            }
        },
        {
            id: "LA-TRUCK-02",
            name: "Plataforma de Carregamento Caminhões 2",
            type: "loadingArea",
            areaType: "truck",
            position: { x: 20, y: 0, z: -5 },
            status: "maintenance",
            parentId: "AREA-CARGA-CAMINHAO",
            tags: ["carregamento", "caminhão", "etanol", "lubrificante"],
            metadata: {
                numberOfBays: 2,
                productsAvailable: ["Etanol", "Óleo Lubrificante"],
                flowMeters: ["FM-2005", "FM-2006"],
                safetySystems: ["Aterramento", "Detecção de transbordo"],
                maintenanceNote: "Reparo no sistema de aterramento da baia 2"
            }
        },
        {
            id: "LA-SHIP-01",
            name: "Píer de Carregamento Navios",
            type: "loadingArea",
            areaType: "ship",
            position: { x: 0, y: 0, z: 20 },
            status: "operational",
            parentId: "AREA-PIER",
            tags: ["carregamento", "navio", "diesel", "marítimo"],
            metadata: {
                berthLength: 150, // metros
                maxDraft: 12, // metros
                loadingArms: ["LA-ARM-01", "LA-ARM-02"],
                productsAvailable: ["Diesel Marítimo", "Diesel S10"],
                mooringSystem: "Bóias e cabos",
                gangway: true
            }
        },
        {
            id: "LA-RAIL-01",
            name: "Terminal Ferroviário",
            type: "loadingArea",
            areaType: "rail",
            position: { x: -20, y: 0, z: 10 },
            status: "operational",
            parentId: "AREA-FERROVIA",
            tags: ["carregamento", "trem", "vagão-tanque", "diesel"],
            metadata: {
                numberOfTracks: 2,
                maxTrainLength: 500, // metros
                loadingPointsPerTrack: 5,
                productsAvailable: ["Diesel S10"],
                spillContainment: true
            }
        }
    ]
};
//# sourceMappingURL=equipment.js.map