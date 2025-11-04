import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for all demo users
  const password = await bcrypt.hash('Password123!', 12);

  // ============================================================
  // TENANT 1: Acme Field Services (CAD)
  // ============================================================

  console.log('\n📦 Creating Tenant 1: Acme Field Services...');

  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Field Services',
      currency: 'CAD',
      status: 'ACTIVE',
      settings: {
        timeZone: 'America/Toronto',
        dateFormat: 'YYYY-MM-DD',
      },
    },
  });

  // Users for Acme
  const acmeAdmin = await prisma.user.create({
    data: {
      tenantId: acme.id,
      email: 'admin@acme.ca',
      password,
      firstName: 'John',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+1-416-555-0101',
    },
  });

  const acmeDispatcher = await prisma.user.create({
    data: {
      tenantId: acme.id,
      email: 'dispatcher@acme.ca',
      password,
      firstName: 'Sarah',
      lastName: 'Dispatcher',
      role: 'DISPATCHER',
      status: 'ACTIVE',
      phone: '+1-416-555-0102',
    },
  });

  const acmeTech1 = await prisma.user.create({
    data: {
      tenantId: acme.id,
      email: 'tech1@acme.ca',
      password,
      firstName: 'Mike',
      lastName: 'Technician',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      phone: '+1-416-555-0103',
    },
  });

  const acmeTech2 = await prisma.user.create({
    data: {
      tenantId: acme.id,
      email: 'tech2@acme.ca',
      password,
      firstName: 'Lisa',
      lastName: 'Service',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      phone: '+1-416-555-0104',
    },
  });

  // Technician profiles
  await prisma.technician.createMany({
    data: [
      {
        tenantId: acme.id,
        userId: acmeTech1.id,
        skills: ['HVAC', 'Plumbing', 'Electrical'],
        certifications: ['Red Seal HVAC', 'Licensed Electrician'],
        status: 'AVAILABLE',
      },
      {
        tenantId: acme.id,
        userId: acmeTech2.id,
        skills: ['Appliance Repair', 'Plumbing'],
        certifications: ['Appliance Repair Certification'],
        status: 'AVAILABLE',
      },
    ],
  });

  // Tax rates for Canada
  await prisma.taxRate.createMany({
    data: [
      {
        tenantId: acme.id,
        code: 'GST',
        name: 'Goods and Services Tax',
        rate: 0.05,
        provinceState: null,
        country: 'CA',
      },
      {
        tenantId: acme.id,
        code: 'PST',
        name: 'Provincial Sales Tax',
        rate: 0.08,
        provinceState: 'ON',
        country: 'CA',
      },
      {
        tenantId: acme.id,
        code: 'HST',
        name: 'Harmonized Sales Tax',
        rate: 0.13,
        provinceState: 'ON',
        country: 'CA',
      },
    ],
  });

  // Price List
  const acmePriceList = await prisma.priceList.create({
    data: {
      tenantId: acme.id,
      name: 'Standard Services',
      description: 'Standard pricing for residential and commercial services',
      currency: 'CAD',
      isDefault: true,
      status: 'ACTIVE',
    },
  });

  await prisma.priceItem.createMany({
    data: [
      {
        tenantId: acme.id,
        priceListId: acmePriceList.id,
        sku: 'SVC-HVAC-DIAG',
        name: 'HVAC Diagnostic',
        description: 'Comprehensive HVAC system diagnostic',
        unit: 'EA',
        defaultRate: 125.0,
        taxCode: 'HST',
        category: 'Labor',
      },
      {
        tenantId: acme.id,
        priceListId: acmePriceList.id,
        sku: 'SVC-HVAC-REPAIR',
        name: 'HVAC Repair - Hourly',
        description: 'Hourly rate for HVAC repairs',
        unit: 'HR',
        defaultRate: 95.0,
        taxCode: 'HST',
        category: 'Labor',
      },
      {
        tenantId: acme.id,
        priceListId: acmePriceList.id,
        sku: 'SVC-PLUMB-DIAG',
        name: 'Plumbing Diagnostic',
        unit: 'EA',
        defaultRate: 110.0,
        taxCode: 'HST',
        category: 'Labor',
      },
      {
        tenantId: acme.id,
        priceListId: acmePriceList.id,
        sku: 'SVC-PLUMB-HOURLY',
        name: 'Plumbing Service - Hourly',
        unit: 'HR',
        defaultRate: 85.0,
        taxCode: 'HST',
        category: 'Labor',
      },
      {
        tenantId: acme.id,
        priceListId: acmePriceList.id,
        sku: 'PART-FILTER-STD',
        name: 'HVAC Filter - Standard',
        unit: 'EA',
        defaultRate: 35.0,
        taxCode: 'HST',
        category: 'Parts',
      },
      {
        tenantId: acme.id,
        priceListId: acmePriceList.id,
        sku: 'PART-THERMOSTAT',
        name: 'Digital Thermostat',
        unit: 'EA',
        defaultRate: 180.0,
        taxCode: 'HST',
        category: 'Parts',
      },
    ],
  });

  // Customers for Acme (20 customers)
  const acmeCustomers = [];
  const customerNames = [
    { name: 'Toronto General Hospital', city: 'Toronto', province: 'ON' },
    { name: 'Maple Leaf Properties Inc', city: 'Mississauga', province: 'ON' },
    { name: 'Northern Lights Restaurant', city: 'Ottawa', province: 'ON' },
    { name: 'Sunnybrook Mall', city: 'Toronto', province: 'ON' },
    { name: 'Blue Mountain Resort', city: 'Collingwood', province: 'ON' },
    { name: 'Kingston Manufacturing Ltd', city: 'Kingston', province: 'ON' },
    { name: 'Waterloo Tech Center', city: 'Waterloo', province: 'ON' },
    { name: 'Hamilton Steel Works', city: 'Hamilton', province: 'ON' },
    { name: 'Ottawa Convention Centre', city: 'Ottawa', province: 'ON' },
    { name: 'London Office Tower', city: 'London', province: 'ON' },
    { name: 'Niagara Falls Hotel Group', city: 'Niagara Falls', province: 'ON' },
    { name: 'Barrie Shopping Plaza', city: 'Barrie', province: 'ON' },
    { name: 'Guelph University Campus', city: 'Guelph', province: 'ON' },
    { name: 'Oshawa Auto Parts', city: 'Oshawa', province: 'ON' },
    { name: 'Kitchener Food Services', city: 'Kitchener', province: 'ON' },
    { name: 'Brampton Medical Clinic', city: 'Brampton', province: 'ON' },
    { name: 'Vaughan Corporate Park', city: 'Vaughan', province: 'ON' },
    { name: 'Markham Tech Solutions', city: 'Markham', province: 'ON' },
    { name: 'Richmond Hill Estates', city: 'Richmond Hill', province: 'ON' },
    { name: 'Scarborough Retail Center', city: 'Scarborough', province: 'ON' },
  ];

  for (let i = 0; i < 20; i++) {
    const custData = customerNames[i];
    const customer = await prisma.customer.create({
      data: {
        tenantId: acme.id,
        name: custData.name,
        email: `contact${i + 1}@${custData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ca`,
        phone: `+1-416-${String(5550200 + i).padStart(7, '0')}`,
        address: `${100 + i * 10} Main Street`,
        city: custData.city,
        provinceState: custData.province,
        postalZip: `M${String(i + 1).padStart(2, '0')}A ${String(i + 1).padStart(2, '0')}B`,
        country: 'CA',
        latitude: 43.65 + Math.random() * 0.5,
        longitude: -79.38 + Math.random() * 0.5,
        status: 'ACTIVE',
        tags: ['Commercial', i % 3 === 0 ? 'Premium' : 'Standard'],
      },
    });
    acmeCustomers.push(customer);

    // Add 1-2 sites per customer
    const numSites = Math.random() > 0.5 ? 2 : 1;
    for (let j = 0; j < numSites; j++) {
      await prisma.site.create({
        data: {
          tenantId: acme.id,
          customerId: customer.id,
          name: j === 0 ? 'Main Location' : 'Secondary Location',
          address: `${200 + i * 10 + j * 5} Oak Avenue`,
          city: custData.city,
          provinceState: custData.province,
          postalZip: `M${String(i + 1).padStart(2, '0')}C ${String(j + 1).padStart(2, '0')}D`,
          country: 'CA',
          latitude: 43.65 + Math.random() * 0.5,
          longitude: -79.38 + Math.random() * 0.5,
        },
      });
    }
  }

  // Quotes for Acme (10 quotes)
  const acmeQuotes = [];
  for (let i = 0; i < 10; i++) {
    const customer = acmeCustomers[i * 2]; // Every other customer
    const status = ['DRAFT', 'SENT', 'APPROVED', 'APPROVED', 'REJECTED'][i % 5];

    const quote = await prisma.quote.create({
      data: {
        tenantId: acme.id,
        number: `Q-2025-${String(i + 1).padStart(6, '0')}`,
        status,
        currency: 'CAD',
        customerId: customer.id,
        title: `${['HVAC Maintenance', 'Plumbing Repair', 'System Upgrade', 'Emergency Service', 'Preventive Maintenance'][i % 5]} - ${customer.name}`,
        description: 'Comprehensive service quote for facility maintenance',
        subtotal: 0,
        taxTotal: 0,
        total: 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: acmeDispatcher.id,
        approvedById: status === 'APPROVED' ? acmeAdmin.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        sentAt: status !== 'DRAFT' ? new Date() : null,
      },
    });

    // Add quote lines
    const lines = [
      { sku: 'SVC-HVAC-DIAG', qty: 1, price: 125.0 },
      { sku: 'SVC-HVAC-REPAIR', qty: 3, price: 95.0 },
      { sku: 'PART-FILTER-STD', qty: 2, price: 35.0 },
    ];

    let subtotal = 0;
    for (let j = 0; j < lines.length; j++) {
      const lineAmount = lines[j].qty * lines[j].price;
      subtotal += lineAmount;

      await prisma.quoteLine.create({
        data: {
          tenantId: acme.id,
          quoteId: quote.id,
          sku: lines[j].sku,
          description: `Service item ${lines[j].sku}`,
          quantity: lines[j].qty,
          unit: 'EA',
          unitPrice: lines[j].price,
          discounts: 0,
          taxes: [{ code: 'HST', rate: 0.13, amount: lineAmount * 0.13 }],
          amount: lineAmount,
          sort: j,
        },
      });
    }

    const taxTotal = subtotal * 0.13;
    const total = subtotal + taxTotal;

    await prisma.quote.update({
      where: { id: quote.id },
      data: { subtotal, taxTotal, total },
    });

    acmeQuotes.push(quote);
  }

  // Jobs for Acme (15 jobs)
  const acmeJobs = [];
  for (let i = 0; i < 15; i++) {
    const customer = acmeCustomers[i];
    const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED'];
    const status = statuses[i % 5];
    const tech = i % 2 === 0 ? acmeTech1 : acmeTech2;

    const scheduledStart = new Date();
    scheduledStart.setDate(scheduledStart.getDate() + (i - 7)); // Some past, some future

    const job = await prisma.job.create({
      data: {
        tenantId: acme.id,
        number: `J-2025-${String(i + 1).padStart(6, '0')}`,
        status,
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4],
        customerId: customer.id,
        quoteId: i < 5 ? acmeQuotes[i].id : null,
        title: `Service Call - ${customer.name}`,
        description: 'Scheduled maintenance and repair',
        scheduledStart,
        scheduledEnd: new Date(scheduledStart.getTime() + 4 * 60 * 60 * 1000), // 4 hours
        actualStart: status !== 'SCHEDULED' ? scheduledStart : null,
        actualEnd: status === 'COMPLETED' ? new Date(scheduledStart.getTime() + 3.5 * 60 * 60 * 1000) : null,
        assignedTechnicianId: tech.id,
        completedAt: status === 'COMPLETED' ? new Date(scheduledStart.getTime() + 3.5 * 60 * 60 * 1000) : null,
      },
    });

    acmeJobs.push(job);

    // Add time entries for completed jobs
    if (status === 'COMPLETED') {
      await prisma.timeEntry.create({
        data: {
          tenantId: acme.id,
          userId: tech.id,
          jobId: job.id,
          type: 'WORK',
          startTime: scheduledStart,
          endTime: new Date(scheduledStart.getTime() + 3.5 * 60 * 60 * 1000),
          duration: 210, // 3.5 hours in minutes
          notes: 'Completed service call',
        },
      });
    }
  }

  // Invoices for Acme (5 invoices from completed jobs)
  for (let i = 0; i < 5; i++) {
    const job = acmeJobs.filter((j) => j.number.includes(`J-2025-${String(i + 3).padStart(6, '0')}`))[0];
    if (!job) continue;

    const subtotal = 455.0;
    const taxTotal = subtotal * 0.13;
    const total = subtotal + taxTotal;

    await prisma.invoice.create({
      data: {
        tenantId: acme.id,
        number: `INV-2025-${String(i + 1).padStart(6, '0')}`,
        status: i < 3 ? 'PAID' : 'SENT',
        currency: 'CAD',
        customerId: job.customerId,
        jobId: job.id,
        subtotal,
        taxTotal,
        total,
        lines: [
          { description: 'HVAC Diagnostic', quantity: 1, unitPrice: 125.0, amount: 125.0 },
          { description: 'Repair Labor (3 hrs)', quantity: 3, unitPrice: 95.0, amount: 285.0 },
          { description: 'Filter Replacement', quantity: 1, unitPrice: 35.0, amount: 35.0 },
        ],
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAt: i < 3 ? new Date() : null,
      },
    });
  }

  // Inventory for Acme
  await prisma.inventoryItem.createMany({
    data: [
      {
        tenantId: acme.id,
        sku: 'PART-FILTER-STD',
        name: 'HVAC Filter - Standard',
        category: 'Parts',
        unit: 'EA',
        qtyOnHand: 45,
        qtyReserved: 5,
        reorderPoint: 20,
        location: 'Warehouse A',
        cost: 18.0,
      },
      {
        tenantId: acme.id,
        sku: 'PART-THERMOSTAT',
        name: 'Digital Thermostat',
        category: 'Parts',
        unit: 'EA',
        qtyOnHand: 12,
        reorderPoint: 5,
        location: 'Warehouse A',
        cost: 95.0,
      },
      {
        tenantId: acme.id,
        sku: 'PART-VALVE-BRASS',
        name: 'Brass Shut-off Valve 1/2"',
        category: 'Parts',
        unit: 'EA',
        qtyOnHand: 28,
        reorderPoint: 15,
        location: 'Warehouse B',
        cost: 12.5,
      },
    ],
  });

  console.log('✅ Acme Field Services seeded successfully!');

  // ============================================================
  // TENANT 2: Coastal Services LLC (USD)
  // ============================================================

  console.log('\n📦 Creating Tenant 2: Coastal Services LLC...');

  const coastal = await prisma.organization.create({
    data: {
      name: 'Coastal Services LLC',
      currency: 'USD',
      status: 'ACTIVE',
      settings: {
        timeZone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
      },
    },
  });

  // Users for Coastal
  const coastalAdmin = await prisma.user.create({
    data: {
      tenantId: coastal.id,
      email: 'admin@coastal-services.com',
      password,
      firstName: 'Jennifer',
      lastName: 'Manager',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+1-415-555-0201',
    },
  });

  const coastalDispatcher = await prisma.user.create({
    data: {
      tenantId: coastal.id,
      email: 'dispatch@coastal-services.com',
      password,
      firstName: 'David',
      lastName: 'Coordinator',
      role: 'DISPATCHER',
      status: 'ACTIVE',
      phone: '+1-415-555-0202',
    },
  });

  const coastalTech1 = await prisma.user.create({
    data: {
      tenantId: coastal.id,
      email: 'tech1@coastal-services.com',
      password,
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      phone: '+1-415-555-0203',
    },
  });

  // Technician profile
  await prisma.technician.create({
    data: {
      tenantId: coastal.id,
      userId: coastalTech1.id,
      skills: ['HVAC', 'Electrical', 'Building Automation'],
      certifications: ['EPA 608 Universal', 'NICET Level II'],
      status: 'AVAILABLE',
    },
  });

  // Tax rates for US (California)
  await prisma.taxRate.createMany({
    data: [
      {
        tenantId: coastal.id,
        code: 'STATE_TAX',
        name: 'California State Tax',
        rate: 0.0725,
        provinceState: 'CA',
        country: 'US',
      },
      {
        tenantId: coastal.id,
        code: 'LOCAL_TAX',
        name: 'San Francisco Local Tax',
        rate: 0.0125,
        provinceState: 'CA',
        country: 'US',
      },
    ],
  });

  // Price List for Coastal
  const coastalPriceList = await prisma.priceList.create({
    data: {
      tenantId: coastal.id,
      name: 'Premium Services',
      description: 'Premium tier pricing for commercial clients',
      currency: 'USD',
      isDefault: true,
      status: 'ACTIVE',
    },
  });

  await prisma.priceItem.createMany({
    data: [
      {
        tenantId: coastal.id,
        priceListId: coastalPriceList.id,
        sku: 'SVC-COMMERCIAL-HVAC',
        name: 'Commercial HVAC Service',
        unit: 'HR',
        defaultRate: 145.0,
        taxCode: 'STATE_TAX',
        category: 'Labor',
      },
      {
        tenantId: coastal.id,
        priceListId: coastalPriceList.id,
        sku: 'SVC-ELEC-REPAIR',
        name: 'Electrical Repair Service',
        unit: 'HR',
        defaultRate: 135.0,
        taxCode: 'STATE_TAX',
        category: 'Labor',
      },
      {
        tenantId: coastal.id,
        priceListId: coastalPriceList.id,
        sku: 'SVC-EMERGENCY',
        name: 'Emergency Service Call',
        unit: 'EA',
        defaultRate: 250.0,
        taxCode: 'STATE_TAX',
        category: 'Labor',
      },
    ],
  });

  // Customers for Coastal (20 customers)
  const coastalCustomers = [];
  const coastalCustomerNames = [
    'San Francisco Tech Hub',
    'Oakland Medical Center',
    'Berkeley University Buildings',
    'Silicon Valley Corporate Campus',
    'Palo Alto Research Facility',
    'San Jose Convention Center',
    'Fremont Manufacturing Plant',
    'Sunnyvale Office Complex',
    'Mountain View Tech Park',
    'Redwood City Marina',
    'Menlo Park Shopping Center',
    'Cupertino Innovation Lab',
    'Santa Clara Stadium',
    'Milpitas Distribution Center',
    'Hayward Industrial Park',
    'Union City Logistics Hub',
    'Daly City Medical Plaza',
    'Pacifica Beach Resort',
    'Half Moon Bay Hotel',
    'Foster City Business Park',
  ];

  for (let i = 0; i < 20; i++) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: coastal.id,
        name: coastalCustomerNames[i],
        email: `contact${i + 1}@${coastalCustomerNames[i].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+1-415-${String(5560300 + i).padStart(7, '0')}`,
        address: `${500 + i * 15} Market Street`,
        city: ['San Francisco', 'Oakland', 'San Jose', 'Palo Alto'][i % 4],
        provinceState: 'CA',
        postalZip: String(94101 + i).padStart(5, '0'),
        country: 'US',
        latitude: 37.77 + Math.random() * 0.3,
        longitude: -122.41 + Math.random() * 0.3,
        status: 'ACTIVE',
        tags: ['Commercial', i % 2 === 0 ? 'Enterprise' : 'Standard'],
      },
    });
    coastalCustomers.push(customer);
  }

  // Quotes for Coastal (10 quotes)
  for (let i = 0; i < 10; i++) {
    const customer = coastalCustomers[i * 2];
    const status = ['DRAFT', 'SENT', 'APPROVED', 'SENT', 'APPROVED'][i % 5];

    const subtotal = 580.0 + i * 50;
    const taxTotal = subtotal * 0.085; // Combined CA tax
    const total = subtotal + taxTotal;

    const quote = await prisma.quote.create({
      data: {
        tenantId: coastal.id,
        number: `Q-2025-${String(i + 1).padStart(6, '0')}`,
        status,
        currency: 'USD',
        customerId: customer.id,
        title: `Commercial Service - ${customer.name}`,
        description: 'Annual maintenance agreement quote',
        subtotal,
        taxTotal,
        total,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: coastalDispatcher.id,
        approvedById: status === 'APPROVED' ? coastalAdmin.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        sentAt: status !== 'DRAFT' ? new Date() : null,
      },
    });

    await prisma.quoteLine.createMany({
      data: [
        {
          tenantId: coastal.id,
          quoteId: quote.id,
          sku: 'SVC-COMMERCIAL-HVAC',
          description: 'HVAC Service (4 hours)',
          quantity: 4,
          unit: 'HR',
          unitPrice: 145.0,
          amount: 580.0,
          taxes: [{ code: 'STATE_TAX', rate: 0.085, amount: 580.0 * 0.085 }],
          sort: 0,
        },
      ],
    });
  }

  // Jobs for Coastal (15 jobs)
  for (let i = 0; i < 15; i++) {
    const customer = coastalCustomers[i];
    const status = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'][i % 4];

    const scheduledStart = new Date();
    scheduledStart.setDate(scheduledStart.getDate() + (i - 5));

    await prisma.job.create({
      data: {
        tenantId: coastal.id,
        number: `J-2025-${String(i + 1).padStart(6, '0')}`,
        status,
        priority: ['MEDIUM', 'HIGH'][i % 2],
        customerId: customer.id,
        title: `Service - ${customer.name}`,
        description: 'Routine maintenance and inspection',
        scheduledStart,
        scheduledEnd: new Date(scheduledStart.getTime() + 4 * 60 * 60 * 1000),
        actualStart: status !== 'SCHEDULED' ? scheduledStart : null,
        actualEnd: status === 'COMPLETED' ? new Date(scheduledStart.getTime() + 4 * 60 * 60 * 1000) : null,
        assignedTechnicianId: coastalTech1.id,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  // Invoices for Coastal (5 invoices)
  for (let i = 0; i < 5; i++) {
    const customer = coastalCustomers[i];

    const subtotal = 580.0;
    const taxTotal = subtotal * 0.085;
    const total = subtotal + taxTotal;

    await prisma.invoice.create({
      data: {
        tenantId: coastal.id,
        number: `INV-2025-${String(i + 1).padStart(6, '0')}`,
        status: i < 2 ? 'PAID' : 'SENT',
        currency: 'USD',
        customerId: customer.id,
        subtotal,
        taxTotal,
        total,
        lines: [
          { description: 'Commercial HVAC Service (4 hrs)', quantity: 4, unitPrice: 145.0, amount: 580.0 },
        ],
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAt: i < 2 ? new Date() : null,
      },
    });
  }

  // Inventory for Coastal
  await prisma.inventoryItem.createMany({
    data: [
      {
        tenantId: coastal.id,
        sku: 'PART-HVAC-FILTER-COMM',
        name: 'Commercial HVAC Filter',
        category: 'Parts',
        unit: 'EA',
        qtyOnHand: 35,
        reorderPoint: 15,
        location: 'Main Warehouse',
        cost: 45.0,
      },
      {
        tenantId: coastal.id,
        sku: 'PART-BREAKER-20A',
        name: '20A Circuit Breaker',
        category: 'Electrical',
        unit: 'EA',
        qtyOnHand: 50,
        reorderPoint: 25,
        location: 'Main Warehouse',
        cost: 15.0,
      },
    ],
  });

  console.log('✅ Coastal Services LLC seeded successfully!');

  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 2 Organizations (tenants)');
  console.log('  - 7 Users total (varying roles)');
  console.log('  - 40 Customers total (20 per tenant)');
  console.log('  - 20 Quotes total');
  console.log('  - 30 Jobs total');
  console.log('  - 10 Invoices total');
  console.log('  - Price lists with items for each tenant');
  console.log('  - Tax rates for CA (Canada) and US');
  console.log('  - Sample inventory items');
  console.log('\n🔑 Demo Credentials:');
  console.log('  Password for all users: Password123!');
  console.log('\n  Tenant 1 (Acme - CAD):');
  console.log('    Admin:      admin@acme.ca');
  console.log('    Dispatcher: dispatcher@acme.ca');
  console.log('    Tech 1:     tech1@acme.ca');
  console.log('    Tech 2:     tech2@acme.ca');
  console.log('\n  Tenant 2 (Coastal - USD):');
  console.log('    Admin:      admin@coastal-services.com');
  console.log('    Dispatcher: dispatch@coastal-services.com');
  console.log('    Tech 1:     tech1@coastal-services.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
