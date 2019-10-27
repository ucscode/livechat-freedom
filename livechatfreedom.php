<?php

class LiveChatFreedom {
	
	private $chat;
	private $password;
	private $request;
	
	public function __construct($password = null) {
		
		if($_SERVER['REQUEST_METHOD'] !== 'POST') exit;
		
		if(is_null($password)) {
			throw new Exception('Password is required in LiveChatFreedom class __Constructor');
			echo json_encode(array('status' => false));
			exit;
		}
		$this->getMessage();
		if(!empty($this->password)) {
			if($this->password === $password) echo json_encode(array('status' => true));
			else echo json_encode(array('status' => false));
			exit;
		};
		
	}
	
	private function getMessage() {
		$message = file_get_contents("php://input");
		$message = json_decode($message, true);
		$keys = array_keys($message);
		
		if(in_array('password', $keys)) return $this->password = $message['password'];
		
		else if(in_array('request', $keys)) {
			$this->request = $message['request'];
			$this->data = $message['args'];
			return;
		} else {
			$message['time'] = $this->period();
			$this->chat = $message;
		};
	}
	
	function activeChat($folder) {
		
		$data = $this->data;
		$file = $folder."/".$data['id'].".txt";
		
		if(!file_exists($file)):
			echo json_encode(array('status' => false, 'error' => "no previous conversation found")); 
			return;
		endif;
		
		$contents = file_get_contents($file);
		$verify_json = json_decode($contents, true);

		if(!$verify_json) {
			echo json_encode(array('status' => false, 'error' => "chat missen"));
			return;
		}
		
		$chat = array('status' => true, 'chat' => $contents);
		
		$this->seen($contents, $file);
		
		echo json_encode($chat);
		return;
	}
	
	private function seen($content, $file) {
		
		$chats = json_decode($content);
		if($this->data['default_msg']) return;

		foreach($chats as $key => $value) {
			if($value->front == $this->data['front']) continue;
			$chats[$key]->seen = true;
		}

		$contents = json_encode($chats);
		
		if(!file_put_contents($file, $contents)) return false;
		else return $contents;
	}
	
	private function session() {
		
		if(session_id() == null) session_start();
		
		if(!isset($_SESSION['LCF-VISITOR'])) {
			$_SESSION['LCF-VISITOR'] = $this->data['id'];
			$new_session = true;
		} else $new_session = false;
			
		$result = array('status' => true, 'id' => $_SESSION['LCF-VISITOR'], 'new_session' => $new_session);
		echo json_encode($result);
		
	}
	
	private function getChatList($path) {
		
		function getFrontChat($array) {
			if($array['front']) return $array;
		}
		
		$dir = new directoryIterator($path);
		
		$feedback =  array();
		
		foreach($dir as $key => $value) {
			
			if($value->isDot()) continue;
			
			$file = $value->getFileName();
			
			if($file == "data.txt") continue;
			
			$filepath = $path.'/'.$file;
			$contents = file_get_contents($filepath);
			$contents = json_decode($contents, true);
			
			if(is_null($contents)) {
				$contents = array();
				$unseen = 0;
			} else $unseen = $this->new_messages($contents);
			
			$frontChat = array_filter($contents, "getFrontChat");
			$lastChat = end($frontChat);
			$isOnline = $this->isOnline($lastChat['time']);
			
			$id = str_replace('.txt', '', $file);
			$result = array('id' => $id, 'isOnline' => $isOnline, 'newMessages' => $unseen, 'displayName' => $this->chatName($id));
			
			array_push($feedback, $result);
			
		}
		
		$feedback['status'] = (empty($id)) ? false : true;
		$feedback = json_encode($feedback);
		echo $feedback;
	}
	
	private function new_messages($contents) {
		$unseen = 0;
		foreach($contents as $value) {
			if($value['front'] == $this->data['front']) continue;
			if(!$value['seen']) $unseen++;
		}
		return $unseen;
	}
	
	private function chatName($id) {
		$hash = hash('sha256', $id);
		$hash = substr($hash, 10, 8);
		return strtoupper($hash);
	}
	
	private function period() {
		$date = new dateTime('now');
		return $date->format("Y-m-d H:i:s");
	}
	
	private function isOnline($time) {
		$date = new dateTime($time);
		$now = new dateTime('now');
		$diff = $date->diff($now);
		$min = $diff->i;
		if($min < 12) return true;
		else return ($min > 30) ? null : false;
	}
	
	private function isAvailable($folder) {
		
		$failed = json_encode(array('status' => false));
		$offline = json_encode(array('status' => true, 'online' => false));
		
		$file = $folder."/data.txt";

		if(!$this->data['front']) {
			
			$statistics = array("time" => $this->period());
			$statistics = json_encode($statistics);
			
			if(file_put_contents($file, $statistics)) $status = true;
			else $status = false;
			
			echo json_encode(array('status' => $status));
			
		} else {
			
			if(!file_exists($file)) {
				echo $offline;
				return;
			}
			
			$statistics = file_get_contents($file);
			if(!$statistics) echo $offline;
			else {
				$statistics = json_decode($statistics, true);
				$isOnline = $this->isOnline($statistics['time']);
				$data = array('status' => true, "online" => $isOnline);
				echo json_encode($data);
			};
			
		}
	}
	
	private function deletechat($folder) {
		$file = $this->data['id'].".txt";
		$file = $folder."/".$file;
		if(file_exists($file)) {
			if(unlink($file)) $status = true;
			else $status = false;
		} else 
			$status = false;
		echo json_encode(array('status' => $status));
	}

	private function getNewChats($folder) {
		
		if(!isset($this->data['id'])) {
			echo json_encode(array('status' => false, 'error' => "missing chat id"));
			return;
		}
		
		$file = $folder."/".$this->data['id'].".txt";
		
		if(file_exists($file)):
		
			$contents = file_get_contents($file);
			$chat = json_decode($contents);
			
			if(!$chat):
				$result = array('status' => false);
				echo json_encode($result);
				return;
			endif;
			
			$unseen_chats = array();
			
			foreach($chat as $key => $value) {
				if($value->front == $this->data['front']) continue;
				if(!$value->seen) {
					$chat[$key]->seen = true;
					array_push($unseen_chats, $chat[$key]);
				};
			}
			
			$unseen_chats = json_encode($unseen_chats);
			$chat = json_encode($chat);
			
			if(!file_put_contents($file, $chat)) {
				$result = array('status' => false, 'error' => 'could not update recent chats');
				echo json_encode($result);
				return;
			} else {
				$result = array('status' => true, 'chat' => $unseen_chats);
				echo json_encode($result);
				return;
			}
			
		else:
		
			$result = array('status' => false, 'error' => "chat terminated");
			echo json_encode($result);
			return;
			
		endif;
	}
	
	public function saveTo($folderpath) {
		
		if($this->request != null) { //var_dump($this->request);
			try {
				$this->{$this->request}($folderpath);
				exit;
			} catch(exception $e) {
				echo $e->getMessage();
			}
		}
		
		/* FOLDER MUST BE AN ABSOLUTE PATH. THUS SHOULD START WITH __DIR__ */
		
		if(!file_exists($folderpath)):
			if(!mkdir($folderpath)) {
				throw new Exception("LiveChatFreedom::saveTo $folderpath neither be found nor created");
				return;
			}
		endif;
		
		if(!isset($this->chat['id']) || is_null($this->chat['id'])) {
			echo json_encode(array('status' => false, 'error' => "no associated chat"));
			die;
		}
		
		$file = $folderpath."/{$this->chat['id']}.txt";
		if(file_exists($file)) {
			$contents = file_get_contents($file);
			$contents = json_decode($contents, true);
			if(is_null($contents)) $contents = array();
		} else $contents = array();
		
		$chat = $this->chat;
		unset($chat['id']);
		$chat['seen'] = isset($chat['default_msg']) ? true : false;
		$chat = array_push($contents, $chat);
		$contents = json_encode($contents);
		
		if(!file_put_contents($file, $contents)) {
			throw new Exception("LiveChatFreedom::saveTo could not save conversation to $file");
			return;
		};
		
		$status = array('status' => true);
		echo json_encode($status);
			
	}
	
}