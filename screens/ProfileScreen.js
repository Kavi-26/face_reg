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
  Image,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';

export default function ProfileScreen({ navigation }) {
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
        Alert.alert('Error', 'User profile not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
    // Validate form
    if (!formData.name.trim() || !formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setUpdating(true);
    try {
      // Update in Firestore
      const userRef = doc(db, 'users', profileData.id);
      await updateDoc(userRef, {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        jobRole: formData.jobRole.trim(),
        assignedSiteLocation: formData.assignedSiteLocation.trim(),
        workingSchedule: formData.workingSchedule.trim(),
        updatedAt: new Date()
      });

      // Update local state
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
    // Reset form data to original values
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

  const handleEditAvatar = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: () => {
            Alert.alert('Info', 'Camera functionality would be implemented here');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            Alert.alert('Info', 'Gallery functionality would be implemented here');
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              <Text style={styles.logoGreen}>RR THULA</Text>
              <Text style={styles.logoBlue}>SI</Text>
            </Text>
            <Text style={styles.tagline}>My Profile</Text>
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(profileData.name || 'User')}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleEditAvatar}
              >
                <Text style={styles.editAvatarText}>✏️</Text>
              </TouchableOpacity>
            </View>
            
            {/* User Type and Status */}
            <View style={styles.userInfoContainer}>
              <View style={[
                styles.typeBadge,
                profileData.type === 'admin' ? styles.adminBadge : styles.employeeBadge
              ]}>
                <Text style={styles.typeBadgeText}>
                  {profileData.type === 'admin' ? 'Admin' : 'Employee'}
                </Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                profileData.action ? styles.approvedBadge : styles.pendingBadge
              ]}>
                <Text style={styles.statusBadgeText}>
                  {profileData.action ? 'Approved' : 'Pending'}
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
                      <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoGreen: {
    color: '#4CAF50',
  },
  logoBlue: {
    color: '#2196F3',
  },
  tagline: {
    fontSize: 18,
    color: '#2196F3',
    marginBottom: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
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
  editAvatarText: {
    fontSize: 16,
    color: '#ffffff',
  },
  userInfoContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  adminBadge: {
    backgroundColor: '#FF6B6B',
  },
  employeeBadge: {
    backgroundColor: '#4ECDC4',
  },
  typeBadgeText: {
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
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    flex: 1,
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
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    paddingBottom: 30,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});