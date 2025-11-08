'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Award, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Technician {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  skills: string[];
  certifications: string[];
  availability: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  status: 'AVAILABLE' | 'ON_JOB' | 'OFF_DUTY';
  activeJobsCount?: number;
  completedJobsCount?: number;
}

export default function TechniciansPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);

  // Mock data - replace with actual API calls
  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: '1',
      userId: 'user1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0100',
      skills: ['HVAC', 'Electrical', 'Plumbing'],
      certifications: ['Red Seal HVAC', 'Electrical License'],
      availability: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
      },
      status: 'ON_JOB',
      activeJobsCount: 2,
      completedJobsCount: 145,
    },
    {
      id: '2',
      userId: 'user2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-0101',
      skills: ['HVAC', 'Refrigeration'],
      certifications: ['HVAC Technician', 'EPA 608 Universal'],
      availability: {
        monday: { start: '07:00', end: '16:00' },
        tuesday: { start: '07:00', end: '16:00' },
        wednesday: { start: '07:00', end: '16:00' },
        thursday: { start: '07:00', end: '16:00' },
        friday: { start: '07:00', end: '16:00' },
      },
      status: 'AVAILABLE',
      activeJobsCount: 0,
      completedJobsCount: 98,
    },
  ]);

  const handleCreateTechnician = (formData: any) => {
    const newTechnician: Technician = {
      id: Date.now().toString(),
      userId: Date.now().toString(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      skills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : [],
      certifications: formData.certifications ? formData.certifications.split(',').map((c: string) => c.trim()) : [],
      availability: {},
      status: 'AVAILABLE',
      activeJobsCount: 0,
      completedJobsCount: 0,
    };
    setTechnicians([...technicians, newTechnician]);
    setShowDialog(false);
    toast({
      title: 'Success',
      description: 'Technician created successfully',
    });
  };

  const handleUpdateTechnician = (id: string, formData: any) => {
    setTechnicians(technicians.map(tech =>
      tech.id === id ? {
        ...tech,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        skills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : [],
        certifications: formData.certifications ? formData.certifications.split(',').map((c: string) => c.trim()) : [],
      } : tech
    ));
    setShowDialog(false);
    setEditingTechnician(null);
    toast({
      title: 'Success',
      description: 'Technician updated successfully',
    });
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians(technicians.filter(tech => tech.id !== id));
    toast({
      title: 'Success',
      description: 'Technician deleted successfully',
    });
  };

  const handleUpdateStatus = (id: string, status: Technician['status']) => {
    setTechnicians(technicians.map(tech =>
      tech.id === id ? { ...tech, status } : tech
    ));
    toast({
      title: 'Success',
      description: `Technician status updated to ${status}`,
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'default';
      case 'ON_JOB':
        return 'secondary';
      case 'OFF_DUTY':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const availableTechnicians = technicians.filter(t => t.status === 'AVAILABLE').length;
  const onJobTechnicians = technicians.filter(t => t.status === 'ON_JOB').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technicians</h1>
          <p className="text-muted-foreground">
            Manage field technicians, skills, certifications, and availability.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Technician Status</div>
            <div className="text-lg font-semibold">
              {availableTechnicians} Available / {onJobTechnicians} On Job
            </div>
          </div>
          <Button onClick={() => {
            setEditingTechnician(null);
            setShowDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Technician
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Total Technicians
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold">{technicians.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Available Now
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {availableTechnicians}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              On Active Jobs
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {onJobTechnicians}
          </div>
        </div>
      </div>

      {/* Technicians Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Certifications</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map((technician) => (
              <TableRow key={technician.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${technician.firstName} ${technician.lastName}`} />
                      <AvatarFallback>
                        {getInitials(technician.firstName, technician.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {technician.firstName} {technician.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {technician.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{technician.email}</div>
                    {technician.phone && (
                      <div className="text-sm text-muted-foreground">
                        {technician.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {technician.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {technician.skills.length > 3 && (
                      <Badge variant="outline">
                        +{technician.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {technician.certifications.slice(0, 2).map((cert, idx) => (
                      <Badge key={idx} variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                    {technician.certifications.length > 2 && (
                      <Badge variant="outline">
                        +{technician.certifications.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {technician.activeJobsCount} Active
                    </div>
                    <div className="text-muted-foreground">
                      {technician.completedJobsCount} Completed
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={technician.status}
                    onValueChange={(value) =>
                      handleUpdateStatus(technician.id, value as Technician['status'])
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="ON_JOB">On Job</SelectItem>
                      <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTechnician(technician);
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTechnician(technician.id)}
                      disabled={technician.activeJobsCount! > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Technician Dialog */}
      <TechnicianDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        technician={editingTechnician}
        onSubmit={(data) => {
          if (editingTechnician) {
            handleUpdateTechnician(editingTechnician.id, data);
          } else {
            handleCreateTechnician(data);
          }
        }}
      />
    </div>
  );
}

function TechnicianDialog({
  open,
  onOpenChange,
  technician,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: Technician | null;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: technician?.firstName || '',
    lastName: technician?.lastName || '',
    email: technician?.email || '',
    phone: technician?.phone || '',
    skills: technician?.skills.join(', ') || '',
    certifications: technician?.certifications.join(', ') || '',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {technician ? 'Edit Technician' : 'Add Technician'}
          </DialogTitle>
          <DialogDescription>
            {technician
              ? 'Update technician information and credentials.'
              : 'Add a new field technician to your team.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Smith"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.smith@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-0100"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="HVAC, Electrical, Plumbing"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter skills separated by commas
            </p>
          </div>
          <div className="col-span-2">
            <Label htmlFor="certifications">Certifications (comma-separated)</Label>
            <Textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="Red Seal HVAC, Electrical License, EPA 608 Universal"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter certifications separated by commas
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {technician ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
