#import "AppDelegate.h"
#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <UserNotifications/UserNotifications.h>
#import <FirebaseMessaging/FirebaseMessaging.h>
#import <React/RCTBridge.h>

@interface AppDelegate () <UNUserNotificationCenterDelegate, FIRMessagingDelegate>
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Configure Firebase
  [FIRApp configure];
  self.moduleName = @"Nagimo";
  self.initialProps = @{};

  // Register for remote notifications using UserNotifications Framework
  if (@available(iOS 10.0, *)) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    UNAuthorizationOptions authOptions = UNAuthorizationOptionAlert |
        UNAuthorizationOptionSound | UNAuthorizationOptionBadge;
    [center requestAuthorizationWithOptions:authOptions
                          completionHandler:^(BOOL granted, NSError * _Nullable error) {
                              // Handle granting of permissions
                          }];
  }
  [application registerForRemoteNotifications];

  // Set the messaging delegate
  [FIRMessaging messaging].delegate = self;

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Open URLs
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [RCTLinkingManager application:application openURL:url options:options];
}

// UserNotificationCenter Delegate Methods

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  // Handle foreground notification
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void(^)(void))completionHandler {
  // Handle background notification response
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  completionHandler();
}

// Firebase Messaging Delegate Methods

- (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(NSString *)fcmToken {
  // Note: This callback is fired at each app startup and whenever a new token is generated.
  NSLog(@"FCM registration token: %@", fcmToken);
  NSDictionary *dataDict = [NSDictionary dictionaryWithObject:fcmToken forKey:@"token"];
  [[NSNotificationCenter defaultCenter] postNotificationName:@"FCMToken" object:nil userInfo:dataDict];
}

// APNs Token Handling

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  // With Firebase SDK 10.4.0 and later, direct setting of the APNs token here is necessary.
  [FIRMessaging messaging].APNSToken = deviceToken;
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"Failed to register for remote notifications: %@", error);
}

@end
