import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

type Privacy = 'public' | 'friends' | 'private';

interface CreateStoryDialogProps {
  visible: boolean;
  onClose: () => void;
  onCreateStory: (imageUri: string, text?: string, privacy?: Privacy) => Promise<void>;
}

export const CreateStoryDialog: React.FC<CreateStoryDialogProps> = ({
  visible,
  onClose,
  onCreateStory,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [isPosting, setIsPosting] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are needed to create stories.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setIsPosting(true);
    try {
      await onCreateStory(image, text, privacy);
      // Reset state
      setImage(null);
      setText('');
      setPrivacy('public');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create story');
    } finally {
      setIsPosting(false);
    }
  };

  const handleClose = () => {
    setImage(null);
    setText('');
    setPrivacy('public');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>Create Story</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        {!image ? (
          <View style={styles.selectContainer}>
            <Text style={styles.selectTitle}>Add to Your Story</Text>
            <Text style={styles.selectSubtitle}>
              Share a moment with your friends
            </Text>

            <View style={styles.optionsContainer}>
              <Pressable style={styles.optionButton} onPress={takePhoto}>
                <Text style={styles.optionIcon}>📷</Text>
                <Text style={styles.optionText}>Take Photo</Text>
              </Pressable>

              <Pressable style={styles.optionButton} onPress={pickImage}>
                <Text style={styles.optionIcon}>🖼️</Text>
                <Text style={styles.optionText}>Choose from Gallery</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            {/* Image Preview */}
            <Image source={{ uri: image }} style={styles.previewImage} />

            {/* Text Overlay */}
            <View style={styles.overlayContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Add text to your story..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={text}
                onChangeText={setText}
                multiline
                maxLength={200}
              />
            </View>

            {/* Privacy Selector */}
            <View style={styles.privacyContainer}>
              <Text style={styles.privacyLabel}>Privacy:</Text>
              <View style={styles.privacyButtons}>
                <Pressable
                  style={[
                    styles.privacyButton,
                    privacy === 'public' && styles.privacyButtonActive,
                  ]}
                  onPress={() => setPrivacy('public')}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacy === 'public' && styles.privacyButtonTextActive,
                    ]}
                  >
                    🌍 Public
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.privacyButton,
                    privacy === 'friends' && styles.privacyButtonActive,
                  ]}
                  onPress={() => setPrivacy('friends')}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacy === 'friends' && styles.privacyButtonTextActive,
                    ]}
                  >
                    👥 Friends
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.privacyButton,
                    privacy === 'private' && styles.privacyButtonActive,
                  ]}
                  onPress={() => setPrivacy('private')}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacy === 'private' && styles.privacyButtonTextActive,
                    ]}
                  >
                    🔒 Private
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Pressable
                style={styles.changeImageButton}
                onPress={() => setImage(null)}
              >
                <Text style={styles.changeImageButtonText}>Change Image</Text>
              </Pressable>
              <Pressable
                style={[styles.postButton, isPosting && styles.postButtonDisabled]}
                onPress={handlePost}
                disabled={isPosting}
              >
                <Text style={styles.postButtonText}>
                  {isPosting ? 'Posting...' : 'Post Story'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 36,
  },
  selectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  selectSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 48,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 16,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: width,
    height: height * 0.6,
    backgroundColor: '#000000',
  },
  overlayContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  privacyContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  privacyLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  privacyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  privacyButtonActive: {
    backgroundColor: '#3b82f6',
  },
  privacyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  privacyButtonTextActive: {
    color: '#ffffff',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  changeImageButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  changeImageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  postButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
