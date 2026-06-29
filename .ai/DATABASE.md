# AayuCare — Database Architecture & Schema

AayuCare uses **PostgreSQL** as its single, unified relational database engine. All transactional, diagnostic, identity, and audit records are managed within PostgreSQL to ensure strict data consistency, ACID guarantees, and secure referential integrity.

---

## 1. Database Philosophy & Tenant Model
AayuCare employs a **multi-tenant design** sharing a single database instance with schema-level or column-level isolation:
* **Tenant Partitioning:** Separation of hospital data is achieved via `hospital_id` columns across relevant operational tables (doctors, patients, appointments, schedules).
* **Referential Constraints:** Foreign keys are explicitly defined to prevent orphaned records. Cascade rules are defined carefully (`ON DELETE RESTRICT` for primary entities to prevent accidental history loss).
* **No Cache/Document Split:** All operational structures are relational. MongoDB and Redis are strictly forbidden.

---

## 2. Table Definitions & Entity Schema

### A. Users Table (`users`)
Authenticating account details for Admin, Doctor, and Patient roles:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### B. Hospitals Table (`hospitals`)
Root tenant entities:
```sql
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    address TEXT,
    contact_number VARCHAR(15),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### D. Doctors Table (`doctors`)
Clinical profiles referencing registered user accounts:
```sql
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    availability_status VARCHAR(20) DEFAULT 'available',
    experience_years INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### E. Patients Table (`patients`)
Registered patient records containing demographic details:
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    aadhaar_number VARCHAR(12) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE NOT NULL,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### F. Appointments Table (`appointments`)
Operational visit records:
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    reason TEXT,
    type VARCHAR(20) DEFAULT 'in_person' CHECK (type IN ('in_person', 'telemedicine')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### G. Prescriptions Table (`prescriptions`)
Medical diagnostic details:
```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    clinical_notes TEXT,
    diagnosis TEXT NOT NULL,
    medications JSONB NOT NULL, -- List of objects: name, dosage, duration, frequency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### H. Health Metrics Table (`health_metrics`)
EHR vital logs:
```sql
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('bp', 'sugar', 'temperature', 'pulse', 'weight')),
    value JSONB NOT NULL, -- Flexible structure for structured vitals
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Database Constraints & Indexing Strategy
To maintain low latency on frequent read queries:
* **Composite Indexes:** Create composite indexes for query filters commonly executed together:
  `CREATE INDEX idx_appointments_lookup ON appointments(hospital_id, appointment_date);`
  `CREATE INDEX idx_doctor_lookup ON doctors(hospital_id, department);`
* **Audit Trail Indexes:** Index `timestamp` fields on audit logs and metrics to optimize history queries.
* **Foreign Key Constraints:** Every relational association must define `ON DELETE` rules clearly to maintain structural integrity.
