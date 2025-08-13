import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfile({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // User profile data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    jobRole: '',
    assignedSiteLocation: '',
    workingSchedule: '',
    type: '',
    action: false,
    adminAccessApproved: false,
    createdAt: null
  });
  
  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    jobRole: '',
    assignedSiteLocation: '',
    workingSchedule: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const userDoc = querySnapshot.docs[0];
        
        const profile = {
          id: userDoc.id,
          ...userData
        };
        
        setProfileData(profile);
        setFormData({
          name: profile.name || '',
          phoneNumber: profile.phoneNumber || '',
          jobRole: profile.jobRole || '',
          assignedSiteLocation: profile.assignedSiteLocation || '',
          workingSchedule: profile.workingSchedule || ''
        });
      } else {
        Alert.alert('Error', 'Admin profile not found');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', profileData.id);
      await updateDoc(userRef, {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        jobRole: formData.jobRole.trim(),
        assignedSiteLocation: formData.assignedSiteLocation.trim(),
        workingSchedule: formData.workingSchedule.trim(),
        updatedAt: new Date()
      });

      setProfileData(prev => ({
        ...prev,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        jobRole: formData.jobRole.trim(),
        assignedSiteLocation: formData.assignedSiteLocation.trim(),
        workingSchedule: formData.workingSchedule.trim()
      }));

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData.name || '',
      phoneNumber: profileData.phoneNumber || '',
      jobRole: profileData.jobRole || '',
      assignedSiteLocation: profileData.assignedSiteLocation || '',
      workingSchedule: profileData.workingSchedule || ''
    });
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Admin Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account</Text>
          </View>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(profileData.name || 'Admin')}
                </Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {/* Status Badges */}
            <View style={styles.badgesContainer}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#ffffff" />
                <Text style={styles.badgeText}>Admin</Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                profileData.adminAccessApproved ? styles.approvedBadge : styles.pendingBadge
              ]}>
                <Text style={styles.statusText}>
                  {profileData.adminAccessApproved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? formData.name : profileData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                editable={isEditing}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileData.email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor="#999"
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? formData.phoneNumber : profileData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                editable={isEditing}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Job Role Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Role</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? formData.jobRole : profileData.jobRole}
                onChangeText={(value) => handleInputChange('jobRole', value)}
                editable={isEditing}
                placeholder="Enter your job role"
                placeholderTextColor="#999"
              />
            </View>

            {/* Assigned Site Location Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assigned Site Location</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={isEditing ? formData.assignedSiteLocation : profileData.assignedSiteLocation}
                onChangeText={(value) => handleInputChange('assignedSiteLocation', value)}
                editable={isEditing}
                placeholder="Enter your assigned location"
                placeholderTextColor="#999"
              />
            </View>

            {/* Working Schedule Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Working Schedule</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled, styles.multilineInput]}
                value={isEditing ? formData.workingSchedule : profileData.workingSchedule}
                onChangeText={(value) => handleInputChange('workingSchedule', value)}
                editable={isEditing}
                placeholder="Enter your working schedule"
                placeholderTextColor="#999"
                multiline
              />
            </View>

            {/* Account Created Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Created</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formatDate(profileData.createdAt)}
                editable={false}
                placeholder="Creation date"
                placeholderTextColor="#999"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!isEditing ? (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create" size={20} color="#ffffff" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editingButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                    disabled={updating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, updating && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={updating}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#ffffff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  signOutButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});