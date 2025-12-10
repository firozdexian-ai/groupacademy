import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, Download, ExternalLink, FileText, Mail, Send } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type ApplicationStatus = Database['public']['Enums']['application_status'];
type DeliveryStatus = Database['public']['Enums']['delivery_status'];

interface JobApplication {
  id: string;
  job_id: string;
  professional_id: string;
  application_status: ApplicationStatus | null;
  delivery_status: DeliveryStatus | null;
  cover_letter: string | null;
  cv_url: string | null;
  is_paid: boolean | null;
  created_at: string | null;
  delivery_error: string | null;
  jobs: {
    title: string;
    company_name: string;
  } | null;
  professionals: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'sent_to_employer', label: 'Sent to Employer' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

const DELIVERY_STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

export const JobApplicationsManager = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (title, company_name),
          professionals (full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data as JobApplication[]);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.professionals?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.professionals?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobs?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.application_status === statusFilter;
    const matchesDelivery = deliveryFilter === 'all' || app.delivery_status === deliveryFilter;

    return matchesSearch && matchesStatus && matchesDelivery;
  });

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ application_status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, application_status: newStatus } : app
        )
      );

      toast({ title: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Applicant Name',
      'Email',
      'Phone',
      'Job Title',
      'Company',
      'Application Status',
      'Delivery Status',
      'Is Paid',
      'Applied At',
      'CV URL',
    ];

    const rows = filteredApplications.map((app) => [
      app.professionals?.full_name || '',
      app.professionals?.email || '',
      app.professionals?.phone || '',
      app.jobs?.title || '',
      app.jobs?.company_name || '',
      app.application_status || '',
      app.delivery_status || '',
      app.is_paid ? 'Yes' : 'No',
      app.created_at ? format(new Date(app.created_at), 'yyyy-MM-dd HH:mm') : '',
      app.cv_url || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `job_applications_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({ title: 'CSV exported successfully' });
  };

  const getStatusBadge = (status: ApplicationStatus | null) => {
    const variants: Record<ApplicationStatus, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      sent_to_employer: 'bg-purple-100 text-purple-800',
      viewed: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={status ? variants[status] : 'bg-gray-100 text-gray-800'}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </Badge>
    );
  };

  const getDeliveryBadge = (status: DeliveryStatus | null) => {
    const variants: Record<DeliveryStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={status ? variants[status] : 'bg-gray-100 text-gray-800'}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading applications...</div>;
  }

  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.application_status === 'submitted').length,
    shortlisted: applications.filter((a) => a.application_status === 'shortlisted').length,
    paid: applications.filter((a) => a.is_paid).length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Job Applications ({filteredApplications.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.submitted} submitted • {stats.shortlisted} shortlisted • {stats.paid} paid
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-4 mt-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, job, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Application Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Delivery Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Delivery</SelectItem>
              {DELIVERY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.professionals?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{app.professionals?.email}</p>
                        {app.professionals?.phone && (
                          <p className="text-sm text-muted-foreground">{app.professionals.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.jobs?.title || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{app.jobs?.company_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={app.application_status || 'submitted'}
                        onValueChange={(value) =>
                          handleStatusChange(app.id, value as ApplicationStatus)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue>{getStatusBadge(app.application_status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {APPLICATION_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getDeliveryBadge(app.delivery_status)}</TableCell>
                    <TableCell>
                      <Badge variant={app.is_paid ? 'default' : 'secondary'}>
                        {app.is_paid ? 'Paid' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.created_at
                        ? format(new Date(app.created_at), 'MMM d, yyyy')
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {app.cv_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(app.cv_url!, '_blank')}
                            title="View CV"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {app.professionals?.email && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              window.open(`mailto:${app.professionals!.email}`, '_blank')
                            }
                            title="Email Applicant"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
