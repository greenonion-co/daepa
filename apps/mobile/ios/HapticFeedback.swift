import UIKit

@objc(HapticFeedback)
class HapticFeedback: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  /// 임팩트 햅틱 피드백 (light, medium, heavy, soft, rigid)
  @objc
  func impact(_ style: String) {
    DispatchQueue.main.async {
      let feedbackStyle: UIImpactFeedbackGenerator.FeedbackStyle

      switch style {
      case "light":
        feedbackStyle = .light
      case "medium":
        feedbackStyle = .medium
      case "heavy":
        feedbackStyle = .heavy
      case "soft":
        if #available(iOS 13.0, *) {
          feedbackStyle = .soft
        } else {
          feedbackStyle = .light
        }
      case "rigid":
        if #available(iOS 13.0, *) {
          feedbackStyle = .rigid
        } else {
          feedbackStyle = .heavy
        }
      default:
        feedbackStyle = .light
      }

      let generator = UIImpactFeedbackGenerator(style: feedbackStyle)
      generator.prepare()
      generator.impactOccurred()
    }
  }

  /// 선택 햅틱 피드백 (탭/선택 시 사용)
  @objc
  func selection() {
    DispatchQueue.main.async {
      let generator = UISelectionFeedbackGenerator()
      generator.prepare()
      generator.selectionChanged()
    }
  }

  /// 알림 햅틱 피드백 (success, warning, error)
  @objc
  func notification(_ type: String) {
    DispatchQueue.main.async {
      let feedbackType: UINotificationFeedbackGenerator.FeedbackType

      switch type {
      case "success":
        feedbackType = .success
      case "warning":
        feedbackType = .warning
      case "error":
        feedbackType = .error
      default:
        feedbackType = .success
      }

      let generator = UINotificationFeedbackGenerator()
      generator.prepare()
      generator.notificationOccurred(feedbackType)
    }
  }
}
