'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, User, Building2, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return response;
    },
  });

  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      if (!userData?.organizationId) return null;
      const response = await apiClient.get(`/api/v1/organizations/${userData.organizationId}`);
      return response.data;
    },
    enabled: !!userData?.organizationId,
  });

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [orgSettings, setOrgSettings] = useState({
    name: '',
    timezone: '',
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
      });
    }
  }, [userData]);

  useEffect(() => {
    if (orgData) {
      setOrgSettings({
        name: orgData.name || '',
        timezone: orgData.timezone || '',
      });
    }
  }, [orgData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userData?.id) throw new Error('User not loaded');
      const response = await apiClient.patch(`/api/v1/users/${userData.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userData?.organizationId) throw new Error('Organization not loaded');
      const response = await apiClient.put(`/api/v1/organizations/${userData.organizationId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgMutation.mutate(orgSettings);
  };

  if (userLoading || orgLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and organization settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building2 className="h-4 w-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <form onSubmit={handleProfileSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <form onSubmit={handleOrgSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgSettings.name}
                    onChange={(e) =>
                      setOrgSettings({ ...orgSettings, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={orgSettings.timezone}
                    onValueChange={(value) =>
                      setOrgSettings({ ...orgSettings, timezone: value })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Toronto">America/Toronto (EST)</SelectItem>
                      <SelectItem value="America/Vancouver">America/Vancouver (PST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (CST)</SelectItem>
                      <SelectItem value="America/Denver">America/Denver (MST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        America/Los_Angeles (PST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateOrgMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateOrgMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Notification settings coming soon. You&apos;ll be able to customize email notifications,
                push notifications, and more.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Change Password</h4>
                <Button variant="outline">Update Password</Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">
                  {userData?.mfaEnabled ? 'Disable' : 'Enable'} 2FA
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Active Sessions</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Manage your active sessions and sign out from other devices
                </p>
                <Button variant="outline">View Sessions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
